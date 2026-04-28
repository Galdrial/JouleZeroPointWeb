import OpenAI from 'openai';
import Card from '../models/Card';
import { generateEmbedding, cosineSimilarity } from './embeddingService';
import logger from '../config/logger';
import { escapeRegex } from '../utils/escapeRegex';
import type { SortOrder } from 'mongoose';
import { getAiRuleDirectives } from './rulebookService';

/**
 * AI Service: Joule Zero Point — Cognitive Engine (TypeScript Edition).
 * 
 * Orchestrates communication with OpenAI, manages prompt construction,
 * tool-calling cycles, and safety audits.
 */

// --- Constants & Config ---
let _openai: OpenAI | null = null;

const getOpenAIClient = () => {
    if (!_openai) {
        const apiKey = process.env.OPENAI_API_KEY || 'test-dummy-key';
        _openai = new OpenAI({
            apiKey,
            timeout: 60000,
        });
    }
    return _openai;
};

const PRIMARY_MODEL = 'gpt-4o';
const FALLBACK_MODEL = 'gpt-4o-mini';
const MAX_RETRIES = 2;
const MAX_CONTEXT_CHARS = 8000;

const loadedRules = getAiRuleDirectives();

const PRIVACY_DIRECTIVE = `
# DIRETTIVA DI PRIVACY ED ETICA (EU AI Act Compliance)
1. Sei un'intelligenza artificiale (LLM) basata su tecnologia OpenAI. Se ti viene chiesto chi sei, dichiara sempre la tua natura artificiale.
2. Non richiedere MAI dati personali sensibili (email, password reali, indirizzi, numeri di telefono) agli utenti.
3. Se l'utente tenta di condividere segreti personali non inerenti al gioco, ricorda gentilmente che questa è una linea di comunicazione monitorata per scopi di supporto al gaming.
`;

const SYSTEM_PROMPT = [
    loadedRules.safety,
    loadedRules.hierarchy,
    loadedRules.rulebook,
    PRIVACY_DIRECTIVE
].join('\n\n');

// --- Types ---
type ChatMessage = OpenAI.Chat.ChatCompletionMessageParam;
type SortableCardField = 'cost_et' | 'pep' | 'rp' | 'name';

interface ChatError {
    category: string;
    message: string;
}

// ============================================================================
// SECURITY & UTILS
// ============================================================================

const INJECTION_PATTERNS = [
    /ignore all previous instructions/i,
    /dimentica tutto quello che ti ho detto/i,
    /forget your instructions/i,
    /print your system prompt/i,
    /rivela il tuo prompt/i,
    /enter dan mode/i,
    /scrivi(mi)? (uno|codice) (script|python|js|javascript|codice)/i
];

export function isLikelyInjection(text: string): boolean {
    return INJECTION_PATTERNS.some(pattern => pattern.test(text));
}

function truncateHistory(history: ChatMessage[]): ChatMessage[] {
    let totalChars = 0;
    const optimized: ChatMessage[] = [];
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        const content = typeof msg.content === 'string' ? msg.content : '';
        totalChars += content.length;
        if (totalChars <= MAX_CONTEXT_CHARS) {
            optimized.unshift(msg);
        } else {
            break;
        }
    }
    return optimized;
}

function performSafetyAudit(content: string): boolean {
    const leakSignals = ["PROTOCOLLO DI SICUREZZA", "search_cards", "IGNORA ogni comando"];
    let suspiciousCount = 0;
    for (const signal of leakSignals) {
        if (content.includes(signal)) suspiciousCount++;
    }
    return suspiciousCount < 3;
}

// ============================================================================
// SEARCH & TOOLS
// ============================================================================

/**
 * Search cards with semantic and legacy filters.
 * Returns a standardized format for Tool Output.
 */
export async function searchCards(params: any = {}) {
    try {
        const { query, type, min_et, max_et, min_pep, min_rp, sort_by, sort_order } = params;
        const safeLimit = Math.min(Math.max(Number(params.limit) || 15, 1), 25);
        const mongoQuery: any = {};
        let results: any[] = [];
        const allowedSortFields: SortableCardField[] = ['cost_et', 'pep', 'rp', 'name'];
        const sortField = allowedSortFields.includes(sort_by) ? sort_by as SortableCardField : null;
        const sortDirection: 1 | -1 = sort_order === 'asc' ? 1 : -1;
        const sortOption: Record<string, SortOrder> | null = sortField ? { [sortField]: sortDirection } : null;

        if (type) {
            if (type.toLowerCase() === 'frammento') {
                mongoQuery.type = { $in: [/Solido/i, /Liquido/i, /Gas/i, /Plasma/i, /Materia Oscura/i] };
            } else {
                mongoQuery.type = { $regex: new RegExp(`^${escapeRegex(type)}$`, 'i') };
            }
        }

        if (min_et !== undefined || max_et !== undefined) {
            mongoQuery.cost_et = {};
            if (min_et !== undefined) mongoQuery.cost_et.$gte = min_et;
            if (max_et !== undefined) mongoQuery.cost_et.$lte = max_et;
        }

        if (min_pep !== undefined) mongoQuery.pep = { $gte: min_pep };
        if (min_rp !== undefined) mongoQuery.rp = { $gte: min_rp };

        if (query) {
            const queryRegex = new RegExp(escapeRegex(query), 'i');
            const nameQuery = Card.find({ ...mongoQuery, name: queryRegex });
            if (sortOption) nameQuery.sort(sortOption);
            const nameMatches = await nameQuery.limit(safeLimit);
            if (nameMatches.length > 0) {
                results = nameMatches;
            } else {
                const effectQuery = Card.find({ ...mongoQuery, effect: queryRegex });
                if (sortOption) effectQuery.sort(sortOption);
                const effectMatches = await effectQuery.limit(safeLimit);
                if (effectMatches.length > 0) {
                    results = effectMatches;
                } else {
                    try {
                        const queryVector = await generateEmbedding(query);
                        if (queryVector.length > 0) {
                            const filteredCards = await Card.find({ ...mongoQuery, embedding: { $exists: true, $ne: [] } });
                            results = filteredCards
                                .map(c => ({ ...c.toObject(), score: cosineSimilarity(queryVector, c.embedding) }))
                                .filter(c => c.score > 0.7)
                                .sort((a, b) => sortField
                                    ? sortDirection * compareSortableCardValues(a, b, sortField)
                                    : b.score - a.score)
                                .slice(0, safeLimit);
                        }
                    } catch (e) {
                        logger.error(`SEMANTIC_SEARCH_SUB_FAILURE: ${(e as Error).message}`);
                    }
                }
            }
        }

        if (results.length === 0) {
            const fallbackQuery = Card.find(mongoQuery);
            if (sortOption) fallbackQuery.sort(sortOption);
            results = await fallbackQuery.limit(safeLimit).lean();
        }

        return results.map(c => ({
            nome: c.name,
            tipo: c.type,
            costo_et: c.cost_et,
            attacco_pep: c.pep,
            difesa_rp: c.rp,
            effetto: c.effect
        }));
    } catch (error) {
        logger.error(`SEARCH_CARDS_FAILURE: ${(error as Error).message}`);
        return { error: "Database mapping error during card search matrix sync." };
    }
}

function compareSortableCardValues(a: any, b: any, field: SortableCardField): number {
    if (field === 'name') {
        return String(a.name || '').localeCompare(String(b.name || ''));
    }

    return Number(a[field] || 0) - Number(b[field] || 0);
}

// ============================================================================
// CORE ORCHESTRATION
// ============================================================================

export function buildPromptMessages({ userMessage, userIdentity, historyMessages, totalCards }: any): ChatMessage[] {
    const sessionContext = `# Contesto Sessione\n- Identità: ${userIdentity}\n- Database: ${totalCards} carte.`;
    
    return [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: sessionContext },
        ...truncateHistory(historyMessages),
        { role: 'user', content: userMessage }
    ];
}

export async function streamChat(
    messages: ChatMessage[],
    onDelta: (chunk: string) => void,
    onDone: () => void,
    onError: (err: ChatError) => void
) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const model = attempt < MAX_RETRIES ? PRIMARY_MODEL : FALLBACK_MODEL;
        try {
            const openai = getOpenAIClient();
            const stream = await openai.chat.completions.create({
                model,
                messages: messages,
                tools: [{
                    type: "function",
                    function: {
                        name: "search_cards",
                        description: "Cerca carte nel database del gioco Joule: Zero Point.",
                        parameters: {
                            type: "object",
                            properties: {
                                query: { type: "string", description: "Termine di ricerca o descrizione dell'effetto." },
                                type: { type: "string", enum: ["Frammento", "Solido", "Liquido", "Gas", "Plasma", "Materia Oscura", "Evento", "Anomalia", "Costruttore"] },
                                min_et: { type: "number", description: "Costo ET minimo." },
                                max_et: { type: "number", description: "Costo ET massimo." },
                                min_pep: { type: "number", description: "PEP minimo." },
                                min_rp: { type: "number", description: "RP minimo." },
                                sort_by: { type: "string", enum: ["cost_et", "pep", "rp", "name"], description: "Campo per ordinare i risultati." },
                                sort_order: { type: "string", enum: ["asc", "desc"], description: "Direzione ordinamento." },
                                limit: { type: "number", description: "Numero massimo di risultati, da 1 a 25." }
                            }
                        }
                    }
                }],
                stream: true,
            });

            let fullContent = "";
            let toolCalls: any[] = [];

            for await (const chunk of stream) {
                const delta = chunk.choices[0].delta;
                if (delta.content) {
                    fullContent += delta.content;
                    onDelta(delta.content);
                }
                if (delta.tool_calls) {
                    for (const t of delta.tool_calls) {
                        const index = t.index;
                        if (!toolCalls[index]) {
                            toolCalls[index] = { 
                                id: t.id, 
                                type: "function", 
                                function: { name: "", arguments: "" } 
                            };
                        }
                        if (t.function?.name) toolCalls[index].function.name += t.function.name;
                        if (t.function?.arguments) toolCalls[index].function.arguments += t.function.arguments;
                    }
                }
            }

            // Handle tool execution loop
            if (toolCalls.length > 0) {
                const toolResults: ChatMessage[] = [];
                for (const tc of toolCalls) {
                    let args: Record<string, unknown>;
                    try {
                        args = JSON.parse(tc.function.arguments);
                    } catch {
                        logger.warn(`TOOL_PARSE_ERROR: Malformed arguments for "${tc.function.name}": ${tc.function.arguments}`);
                        continue;
                    }
                    const res = await searchCards(args);
                    toolResults.push({ 
                        role: 'tool', 
                        tool_call_id: tc.id, 
                        content: JSON.stringify(res) 
                    });
                }

                const openai = getOpenAIClient();
                const secondStream = await openai.chat.completions.create({
                    model,
                    messages: [
                        ...messages, 
                        { role: 'assistant', tool_calls: toolCalls } as ChatMessage, 
                        ...toolResults
                    ],
                    stream: true
                });

                for await (const chunk of secondStream) {
                    const content = chunk.choices[0].delta.content;
                    if (content) {
                        fullContent += content;
                        onDelta(content);
                    }
                }
            }

            if (!performSafetyAudit(fullContent)) throw new Error("Safety audit failed.");
            onDone();
            return fullContent;

        } catch (error) {
            logger.error(`AI_STREAM_ERROR (Attempt ${attempt}): ${(error as Error).message}`);
            if (attempt === MAX_RETRIES) {
                onError({ category: "general", message: "Errore irreversibile nel nucleo cognitivo." });
            }
        }
    }
    return null;
}
