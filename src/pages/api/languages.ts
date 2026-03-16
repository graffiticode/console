/**
 * Language registry for Graffiticode
 *
 * Language specs are fetched dynamically from l{langId}.graffiticode.org/spec.html
 */

import { LANGUAGES, listLanguages as listLangs, type Language } from "../../lib/languages";

export type { Language };

export interface LanguageInfo extends Language {
  examples: string[];
  reactComponent: {
    package: string;
    component: string;
    styleImport?: string;
  };
  specUrl: string;
}

export { listLangs as listLanguages };

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
