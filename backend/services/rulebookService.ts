import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

type RulebookBlock = {
  kind: 'text' | 'list';
  title?: string;
  body?: string;
  items?: string[];
};

type RulebookSection = {
  id: string;
  title: string;
  blocks: RulebookBlock[];
};

type RulebookDownload = {
  label: string;
  href: string;
  fileName: string;
  format: string;
};

type RulebookSeo = {
  pageTitle: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
};

type RulebookIntroduction = {
  eyebrow: string;
  description: string;
  download: RulebookDownload;
};

type RulebookAi = {
  safety: string;
  hierarchy: string;
  rulebook: string;
};

type RulebookConfig = {
  version: string;
  title: string;
  legalNotice: string;
  seo: RulebookSeo;
  introduction: RulebookIntroduction;
  sections: RulebookSection[];
  ai: RulebookAi;
};

type PublicRulebook = Omit<RulebookConfig, 'ai'>;

const FALLBACK_RULEBOOK: RulebookConfig = {
  version: '6.0',
  title: 'JOULE: ZERO POINT – Regolamento Ufficiale',
  legalNotice: 'JOULE: ZERO POINT © 2026 Simone Camerano. Tutti i diritti riservati.',
  seo: {
    pageTitle: 'Regolamento Ufficiale 6.0 - Joule: Zero Point',
    description: 'Consulta il regolamento ufficiale di Joule: Zero Point.',
    ogTitle: 'Joule: Zero Point - Regolamento Ufficiale v6.0',
    ogDescription: 'Direttive operative complete di Joule: Zero Point.'
  },
  introduction: {
    eyebrow: 'DIRETTIVE OPERATIVE: JOULE ZERO POINT v6.0',
    description: 'Regolamento di fallback del sistema.',
    download: {
      label: 'SCARICA PDF UFFICIALE',
      href: '/Regolamento_Joule_Zero_Point_v6.pdf',
      fileName: 'Regolamento_Joule_Zero_Point_v6.pdf',
      format: 'pdf'
    }
  },
  sections: [],
  ai: {
    safety: 'Sei un arbitro esperto di Joule: Zero Point. Rispondi in italiano.',
    hierarchy: 'Il testo della carta vince sempre.',
    rulebook: 'Regole base: IT 20, ET 3, TP 0.'
  }
};

let cachedRulebook: RulebookConfig | null = null;

function getRulebookPath() {
  return path.join(process.cwd(), 'config', 'rulebook.json');
}

export function loadRulebookConfig(): RulebookConfig {
  if (cachedRulebook) {
    return cachedRulebook;
  }

  try {
    const rulebookPath = getRulebookPath();
    const content = fs.readFileSync(rulebookPath, 'utf8');
    cachedRulebook = JSON.parse(content) as RulebookConfig;
    return cachedRulebook;
  } catch (error) {
    logger.error(`RULEBOOK_LOAD_FAILURE: ${(error as Error).message}. Using fallback.`);
    cachedRulebook = FALLBACK_RULEBOOK;
    return cachedRulebook;
  }
}

export function getPublicRulebook(): PublicRulebook {
  const { ai, ...publicRulebook } = loadRulebookConfig();
  return publicRulebook;
}

export function getAiRuleDirectives(): RulebookAi {
  return loadRulebookConfig().ai;
}
