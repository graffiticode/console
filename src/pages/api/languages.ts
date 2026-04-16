/**
 * Language registry for Graffiticode
 *
 * Language specs are fetched dynamically from l{langId}.graffiticode.org/spec.html.
 * Agent-facing authoring envelope (authoringGuide, supportedItemTypes,
 * examplePrompts) and the full user-guide markdown are fetched from the
 * language server by getLanguageServerDoc().
 */

import { LANGUAGES, listLanguages as listLangs, type Language } from "../../lib/languages";
import { getLanguageServerDoc } from "../../lib/language-server-client";

export type { Language };

export interface ExamplePrompt {
  prompt: string;
  produces?: string;
  notes?: string;
}

export interface LanguageInfo extends Language {
  examples: string[];
  reactComponent: {
    package: string;
    component: string;
    styleImport?: string;
  };
  specUrl: string;
  authoringGuide: string | null;
  supportedItemTypes: string[];
  examplePrompts: ExamplePrompt[];
  userGuide: string | null;
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

  const { envelope, userGuide } = await getLanguageServerDoc(langId);

  return {
    ...baseLang,
    description: envelope?.description ?? baseLang.description,
    examples: [],
    reactComponent: {
      package: `@graffiticode/l${langId}`,
      component: "Form",
      styleImport: `@graffiticode/l${langId}/style.css`,
    },
    specUrl,
    authoringGuide: envelope?.authoring_guide ?? null,
    supportedItemTypes: envelope?.supported_item_types ?? [],
    examplePrompts: envelope?.example_prompts ?? [],
    userGuide: userGuide ?? null,
  };
}
