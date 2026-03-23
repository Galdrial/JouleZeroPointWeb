require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  console.log("Inizializzazione del Terminale del Punto Zero (AI Oracolo)...");
  
  try {
    // 1. Carica i file di documentazione
    const filePaths = ['../Regolamento 5.0.txt', '../archivio.pdf', '../flyer.pdf'];
    const uploadedFiles = [];
    
    for (const filePath of filePaths) {
      if (fs.existsSync(path.join(__dirname, filePath))) {
        console.log(`Caricamento di ${filePath}...`);
        const file = await openai.files.create({
          file: fs.createReadStream(path.join(__dirname, filePath)),
          purpose: 'assistants',
        });
        uploadedFiles.push(file.id);
      } else {
        console.warn(`Attenzione: File non trovato ${filePath}`);
      }
    }

    if (uploadedFiles.length === 0) {
      console.error("Nessun file trovato. Assicurati che Regolamento, archivio e flyer siano nella cartella principale.");
      return;
    }

    // 2. Crea il Vector Store
    console.log("Creazione del Vector Store per l'elaborazione semantica RAG...");
    const vectorStore = await openai.vectorStores.create({
      name: "Conoscenza Joule Zero Point"
    });

    // 3. Aggiungi i file al Vector Store
    console.log("Costruzione del ponte neurale (Elaborazione file in corso, potrebbe richiedere qualche secondo)...");
    await openai.vectorStores.fileBatches.createAndPoll(vectorStore.id, {
      file_ids: uploadedFiles
    });

    // 4. Crea l'Assistente
    console.log("Configurazione delle direttive dell'Assistente Terminale...");
    const assistant = await openai.beta.assistants.create({
      name: "Terminale del Punto Zero",
      instructions: `Sei l'Oracolo (Terminale del Punto Zero) del gioco di carte "Joule: Zero Point". Il tuo scopo è rispondere a qualsiasi dubbio sulle regole del gioco, sulla lore o sulle statistiche delle singole carte. 
Le regole ufficiali e l'ambientazione si trovano nei documenti allegati (usa SEMPRE il tool file_search per scansionare il Vector Store prima di rispondere a domande regolamentari). 
Quando l'utente ti chiede dettagli su una specifica carta (es. "Quanto costa la carta Nucleo di Basalto?" o "Qual è l'effetto della Marea?"), non ipotizzare o inventare, ma usa IMMEDIATAMENTE la tua funzione tool 'search_cards' per estrarre i dati esatti dal database quantico in tempo reale.
Le tue risposte devono essere sempre chirurgiche, precise al millimetro, formattate elegantemente con elenchi puntati o grassetti se necessario, e caratterizzate da un sottile e affascinante tono narrativo sci-fi / post-apocalittico. Rivolgiti all'utente chiamandolo "Costruttore".`,
      model: "gpt-4o-mini",
      tools: [
        { type: "file_search" },
        { 
          type: "function",
          function: {
            name: "search_cards",
            description: "Cerca informazioni precise su una o più carte all'interno del database live estraendone Costo ET, PEP, RP ed Errore di Sistema (Effetto).",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string", description: "Il nome della carta da cercare (es. 'Nucleo di Basalto', 'Anomalia') o una parola chiave." }
              },
              required: ["query"]
            }
          }
        }
      ],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id]
        }
      }
    });

    console.log("==============================================");
    console.log("SUCCESS! L'entità IA è nata.");
    console.log(`ASSISTANT_ID=${assistant.id}`);
    console.log("==============================================");
    
    // Scrive in automatico nel .env
    fs.appendFileSync(path.join(__dirname, '.env'), `\nASSISTANT_ID=${assistant.id}\n`);
    console.log("L'ID del Terminale è stato incorporato nel file .env (protetto da Git).");

  } catch (error) {
    console.error("Errore critico durante l'inizializzazione dell'IA:", error);
  }
}

main();
