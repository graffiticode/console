import { getLanguageServerDoc } from "./language-server-client";

export interface Language {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  routingHint?: string;
  category: string;
  domains: string[];
  status?: string;
}

export const LANGUAGES: Language[] = [
  { id: "0001", name: "L0001", description: "Base language", category: "general", domains: ["hide"] },
  { id: "0002", name: "L0002", description: "Core language", category: "general", domains: ["graffiticode"] },
  { id: "0011", name: "L0011", description: "Property editors", category: "general", domains: ["hide"] },
  { id: "0012", name: "L0012", description: "Object viewers", category: "general", domains: ["hide"] },
  { id: "0137", name: "L0137", description: "Data transformers", category: "data", domains: ["hide"] },
  { id: "0146", name: "L0146", description: "SVG scrapers", category: "data", domains: ["hide"] },
  { id: "0147", name: "L0147", description: "Chart renderers", category: "data", domains: ["hide"] },
  { id: "0150", name: "L0150", description: "Free shipping calculators", category: "data", domains: ["hide"] },
  { id: "0151", name: "L0151", description: "Spreadsheets questions", category: "data", domains: ["hide"] },
  { id: "0152", name: "L0152", description: "Interactive map questions", category: "data", domains: ["hide"] },
  { id: "0153", name: "L0153", description: "Area model questions", routingHint: "Area model multiplication questions with visual grid representations.", category: "data", domains: ["appliedscoring", "graffiticode"], status: "Beta" },
  { id: "0154", name: "L0154", description: "Magic square questions", routingHint: "Magic square puzzle questions with grid-based number placement.", category: "data", domains: ["graffiticode"], status: "Beta" },
  { id: "0155", name: "L0155", description: "Stoplight questions", category: "data", domains: ["hide"] },
  { id: "0156", name: "L0156", description: "Short text scorers", category: "data", domains: ["hide"] },
  { id: "0157", name: "L0157", description: "Geoboard manipulatives", category: "data", domains: ["hide"] },
  { id: "0158", name: "L0158", description: "Learnosity assessments", routingHint: "Learnosity assessment items — MCQ, short text, cloze, formula, classification, order list, and choice matrix question types via Learnosity API.", category: "data", domains: ["appliedscoring", "graffiticode"] },
  { id: "0159", name: "L0159", description: "Flashcards, Match and Memory card games", routingHint: "Flashcard study decks, match games, and memory card games with LaTeX math support. Define fact pairs for card-based learning activities.", category: "data", domains: ["appliedscoring", "graffiticode"] },
  { id: "0160", name: "L0160", description: "Learnosity QTI Importer", category: "data", domains: ["hide"] },
  { id: "0161", name: "L0161", description: "Expression translators", category: "data", domains: ["hide"] },
  { id: "0162", name: "L0162", description: "Walking routes", category: "data", domains: ["hide"] },
  { id: "0163", name: "L0163", description: "Code editors", category: "data", domains: ["hide"] },
  { id: "0164", name: "L0164", description: "Code generators", category: "data", domains: ["hide"] },
  { id: "0166", name: "L0166", description: "Spreadsheets", routingHint: "Interactive spreadsheet authoring with tabular cell data, cell-level formatting, formulas (SUM, AVERAGE, ROUND, IF), parameterized values, and optional assessment validation.", category: "data", domains: ["appliedscoring", "embedsheets", "graffiticode"] },
  { id: "0169", name: "L0169", description: "Concept web assessments", routingHint: "Interactive concept web diagrams with central anchor, radial connections, custom edges, drag-and-drop concepts and relation labels, and node styling.", category: "data", domains: ["appliedscoring", "graffiticode"] },
  { id: "0170", name: "L0170", description: "Data transformations", routingHint: "Data transformation pipelines inspired by dplyr and jq. Fetch JSON/CSV from external URLs, navigate nested data, filter/select/mutate/group/sort/join/flatten/unique datasets.", category: "data", domains: ["graffiticode"] },
  { id: "0171", name: "L0171", description: "Venn diagrams", routingHint: "Venn diagrams with named sets, intersections, elements, configurable overlap, and styling.", category: "data", domains: ["graffiticode"], status: "Beta" },
  { id: "0172", name: "L0172", description: "FigJam content", routingHint: "FigJam board content authoring.", category: "data", domains: ["graffiticode"] },
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

export async function listLanguages({ category, search, domain }: { category?: string; search?: string; domain?: string }): Promise<Language[]> {
  let results = selectLanguages(domain || "graffiticode");

  if (category) {
    results = results.filter(lang => lang.category === category);
  }

  // Populate longDescription from each language's language-info.json when
  // available; getLanguageServerDoc caches with a TTL so repeat calls are
  // in-memory lookups. The short description stays as the hardcoded value.
  results = await Promise.all(
    results.map(async (lang) => {
      const { envelope } = await getLanguageServerDoc(lang.id);
      if (envelope?.description) {
        return { ...lang, longDescription: envelope.description };
      }
      return lang;
    })
  );

  if (search) {
    const searchLower = search.toLowerCase();
    results = results.filter(lang =>
      lang.name.toLowerCase().includes(searchLower) ||
      lang.description.toLowerCase().includes(searchLower) ||
      (lang.longDescription || "").toLowerCase().includes(searchLower)
    );
  }

  return results;
}
