export interface Language {
  id: string;
  name: string;
  description: string;
  category: string;
  domains: string[];
}

export const LANGUAGES: Language[] = [
  { id: "0001", name: "L0001", description: "Base language", category: "general", domains: ["hide"] },
  { id: "0002", name: "L0002", description: "Simple programs with text rendering and theming", category: "general", domains: ["graffiticode"] },
  { id: "0011", name: "L0011", description: "Property editors", category: "general", domains: ["hide"] },
  { id: "0012", name: "L0012", description: "Object viewers", category: "general", domains: ["hide"] },
  { id: "0137", name: "L0137", description: "Data transformers", category: "data", domains: ["hide"] },
  { id: "0146", name: "L0146", description: "SVG scrapers", category: "data", domains: ["hide"] },
  { id: "0147", name: "L0147", description: "Chart renderers", category: "data", domains: ["hide"] },
  { id: "0150", name: "L0150", description: "Free shipping calculators", category: "data", domains: ["hide"] },
  { id: "0151", name: "L0151", description: "Spreadsheets questions", category: "data", domains: ["hide"] },
  { id: "0152", name: "L0152", description: "Interactive map questions", category: "data", domains: ["hide"] },
  { id: "0153", name: "L0153", description: "Area model questions", category: "data", domains: ["appliedscoring", "graffiticode"] },
  { id: "0154", name: "L0154", description: "Magic square questions", category: "data", domains: ["graffiticode"] },
  { id: "0155", name: "L0155", description: "Stoplight questions", category: "data", domains: ["hide"] },
  { id: "0156", name: "L0156", description: "Short text scorers", category: "data", domains: ["hide"] },
  { id: "0157", name: "L0157", description: "Geoboard manipulatives", category: "data", domains: ["hide"] },
  { id: "0158", name: "L0158", description: "Learnosity integrations", category: "data", domains: ["appliedscoring", "graffiticode"] },
  { id: "0159", name: "L0159", description: "Flashcards, Match and Memory card games", category: "data", domains: ["appliedscoring", "graffiticode"] },
  { id: "0160", name: "L0160", description: "Learnosity QTI Importer", category: "data", domains: ["hide"] },
  { id: "0161", name: "L0161", description: "Expression translators", category: "data", domains: ["hide"] },
  { id: "0162", name: "L0162", description: "Walking routes", category: "data", domains: ["hide"] },
  { id: "0163", name: "L0163", description: "Code editors", category: "data", domains: ["hide"] },
  { id: "0164", name: "L0164", description: "Code generators", category: "data", domains: ["hide"] },
  { id: "0166", name: "L0166", description: "Spreadsheets", category: "data", domains: ["appliedscoring", "embedsheets", "graffiticode"] },
  { id: "0169", name: "L0169", description: "Concept web assessments", category: "data", domains: ["appliedscoring", "graffiticode"] },
];

export function findLanguageById(id: string): Language | undefined {
  const normalized = id.replace(/^L/i, "").padStart(4, "0");
  return LANGUAGES.find(l => l.id === normalized);
}

export function selectLanguages(domain: string): Language[] {
  domain = domain.toLowerCase();
  return LANGUAGES.filter(lang =>
    domain === "graffiticode" && !lang.domains.includes("hide") ||
      lang.domains.length === 0 ||
      lang.domains.includes(domain)
  );
}

export function listLanguages({ category, search, domain }: { category?: string; search?: string; domain?: string }): Language[] {
  let results = selectLanguages(domain || "graffiticode");

  if (category) {
    results = results.filter(lang => lang.category === category);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    results = results.filter(lang =>
      lang.name.toLowerCase().includes(searchLower) ||
      lang.description.toLowerCase().includes(searchLower)
    );
  }

  return results;
}
