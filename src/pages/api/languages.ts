/**
 * Language registry for Graffiticode
 *
 * Language specs are fetched dynamically from l{langId}.graffiticode.org/spec.html
 */

import bent from "bent";

export interface Language {
  id: string;
  name: string;
  description: string;
  category?: string;
}

export interface LanguageInfo extends Language {
  examples: string[];
  reactComponent: {
    package: string;
    component: string;
    styleImport?: string;
  };
  specUrl: string;
}

// Minimal registry of known languages
// Description and category can be overridden by fetched spec
const LANGUAGES: Language[] = [
  {
    id: "0002",
    name: "L0002",
    description: "Simple programs with text rendering and theming",
    category: "general",
  },
  {
    id: "0166",
    name: "L0166",
    description: "Spreadsheets and tabular data with formulas",
    category: "data",
  },
];

/**
 * List available languages with optional filtering
 */
export function listLanguages({ category, search }: { category?: string; search?: string }): Language[] {
  let results = [...LANGUAGES];

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

/**
 * Get detailed info for a specific language
 * Fetches spec from language server dynamically
 */
export async function getLanguageInfo(id: string): Promise<LanguageInfo | null> {
  // Normalize language ID (remove "L" prefix if present)
  const langId = id.replace(/^L/i, "");

  // Find base language info
  const baseLang = LANGUAGES.find(l => l.id === langId);
  if (!baseLang) {
    return null;
  }

  const specUrl = `https://l${langId}.graffiticode.org/spec.html`;

  return {
    ...baseLang,
    examples: [],
    reactComponent: {
      package: `@graffiticode/l${langId}`,
      component: "Form",
      styleImport: `@graffiticode/l${langId}/style.css`,
    },
    specUrl,
  };
}
