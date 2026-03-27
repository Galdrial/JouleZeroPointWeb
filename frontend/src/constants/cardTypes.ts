export type CardTypeOption = {
  value: string;
  label: string;
  color: string;
};

export const CARDS_VIEW_TYPE_OPTIONS: CardTypeOption[] = [
  { value: "", label: "Tutti", color: "transparent" },
  { value: "Solido", label: "Solido", color: "#007bff" },
  { value: "Liquido", label: "Liquido", color: "#28a745" },
  { value: "Gas", label: "Gas", color: "#fd7e14" },
  { value: "Plasma", label: "Plasma", color: "#ff9f1c" },
  { value: "Materia Oscura", label: "Materia Oscura", color: "#bf00ff" },
  { value: "Evento", label: "Evento", color: "#cd7f32" },
  { value: "Anomalia", label: "Anomalia", color: "#e0e0e0" },
  { value: "Costruttore", label: "Costruttore", color: "#ffd700" },
];

export const DECKBUILDER_TYPE_OPTIONS: CardTypeOption[] = [
  { label: "TUTTI I TIPI", value: "", color: "transparent" },
  { label: "Solido", value: "Solido", color: "#007bff" },
  { label: "Liquido", value: "Liquido", color: "#28a745" },
  { label: "Gas", value: "Gas", color: "#fd7e14" },
  { label: "Plasma", value: "Plasma", color: "#dc3545" },
  { label: "Materia Oscura", value: "Materia Oscura", color: "#8a2be2" },
  { label: "Evento", value: "Evento", color: "#cd7f32" },
  { label: "Anomalia", value: "Anomalia", color: "#c0c0c0" },
];

export const FRAGMENT_TYPES = [
  "Solido",
  "Liquido",
  "Gas",
  "Plasma",
  "Materia Oscura",
] as const;

export const EVENT_TYPES = ["Evento", "Anomalia"] as const;

export const TYPE_COLOR_GRADIENTS: Record<string, string> = {
  Solido: "linear-gradient(90deg, #007bff, #0099ff)",
  Liquido: "linear-gradient(90deg, #28a745, #00e676)",
  Gas: "linear-gradient(90deg, #fd7e14, #ffaa44)",
  Plasma: "linear-gradient(90deg, #dc3545, #ff5566)",
  "Materia Oscura": "linear-gradient(90deg, #8a2be2, #bb55ff)",
  Evento: "linear-gradient(90deg, #cd7f32, #f0a050)",
  Anomalia: "linear-gradient(90deg, #888, #c0c0c0)",
  Costruttore: "linear-gradient(90deg, #ffd700, #ffe94d)",
};

export const TYPE_GLOWS: Record<string, string> = {
  Solido: "0 0 12px rgba(0, 123, 255, 0.9), 0 0 4px rgba(0, 153, 255, 0.7)",
  Liquido: "0 0 12px rgba(40, 167, 69, 0.9), 0 0 4px rgba(0, 230, 118, 0.7)",
  Gas: "0 0 12px rgba(253, 126, 20, 0.9), 0 0 4px rgba(255, 170, 68, 0.7)",
  Plasma: "0 0 12px rgba(220, 53, 69, 0.9), 0 0 4px rgba(255, 85, 102, 0.7)",
  "Materia Oscura":
    "0 0 12px rgba(138, 43, 226, 0.9), 0 0 4px rgba(187, 85, 255, 0.7)",
  Evento: "0 0 12px rgba(205, 127, 50, 0.9), 0 0 4px rgba(240, 160, 80, 0.7)",
  Anomalia:
    "0 0 12px rgba(192, 192, 192, 0.6), 0 0 4px rgba(255, 255, 255, 0.4)",
  Costruttore:
    "0 0 12px rgba(255, 215, 0, 0.9), 0 0 4px rgba(255, 233, 77, 0.7)",
};