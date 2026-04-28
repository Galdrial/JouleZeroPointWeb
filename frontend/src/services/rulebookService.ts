import api from "../utils/api";

export interface RulebookBlock {
  kind: "text" | "list";
  title?: string;
  body?: string;
  items?: string[];
}

export interface RulebookSection {
  id: string;
  title: string;
  blocks: RulebookBlock[];
}

export interface PublicRulebook {
  version: string;
  title: string;
  legalNotice: string;
  seo: {
    pageTitle: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  };
  introduction: {
    eyebrow: string;
    description: string;
    download: {
      label: string;
      href: string;
      fileName: string;
      format: string;
    };
  };
  sections: RulebookSection[];
}

export async function getPublicRulebook() {
  const response = await api.get<PublicRulebook>("/rules");
  return response.data;
}
