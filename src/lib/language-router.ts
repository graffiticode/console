import axios from "axios";
import { CLAUDE_MODELS } from "./code-generation-service";
import { listLanguages } from "./languages";

interface LanguageSuggestion {
  id: string;
  name: string;
  description: string;
  reason: string;
}

interface RoutingResult {
  suggestions: LanguageSuggestion[];
}

interface InnerPlan {
  inner: { lang: string; prompt: string } | null;
}

export async function findBestLanguages({
  userRequest,
  outOfScopeReason,
  currentLang,
}: {
  userRequest: string;
  outOfScopeReason: string;
  currentLang: string;
}): Promise<RoutingResult> {
  try {
    const languages = await listLanguages({});
    const candidates = languages.filter((l) => l.id !== currentLang);

    if (candidates.length === 0) {
      return { suggestions: [] };
    }

    const catalog = candidates
      .map((l) => `- L${l.id}: ${l.routingHint || l.description}`)
      .join("\n");

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn("[language-router] ANTHROPIC_API_KEY not set");
      return { suggestions: [] };
    }

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: CLAUDE_MODELS.HAIKU,
        max_tokens: 500,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: `A user asked: "${userRequest}"

This was rejected by the current language (L${currentLang}) because: ${outOfScopeReason}

Available languages:
${catalog}

Which languages (max 3) could handle this request? Match based on specific capabilities described above. Return JSON only:
{"suggestions": [{"id": "0159", "reason": "brief explanation"}]}

If none fit, return {"suggestions": []}`,
          },
        ],
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );

    const text = response.data?.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { suggestions: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const suggestions: LanguageSuggestion[] = (parsed.suggestions || [])
      .slice(0, 3)
      .map((s: { id: string; reason: string }) => {
        const lang = candidates.find((l) => l.id === s.id);
        return {
          id: s.id,
          name: lang?.name || `L${s.id}`,
          description: lang?.description || "",
          reason: s.reason,
        };
      })
      .filter((s: LanguageSuggestion) => s.description);

    return { suggestions };
  } catch (error) {
    console.error("[language-router] Error:", error.message);
    return { suggestions: [] };
  }
}

export async function planInnerForRequest({
  userRequest,
  innerNeed,
  outerLang,
}: {
  userRequest: string;
  innerNeed: string;
  outerLang: string;
}): Promise<InnerPlan> {
  try {
    const languages = await listLanguages({});
    const candidates = languages.filter((l) => l.id !== outerLang);

    if (candidates.length === 0) {
      return { inner: null };
    }

    const catalog = candidates
      .map((l) => `- L${l.id}: ${l.routingHint || l.description}`)
      .join("\n");

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn("[language-router] ANTHROPIC_API_KEY not set");
      return { inner: null };
    }

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: CLAUDE_MODELS.HAIKU,
        max_tokens: 200,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: `A user asked: "${userRequest}"

The outer language (L${outerLang}) needs to compose with inner content described as:
"${innerNeed}"

Available languages that could produce the inner content:
${catalog}

Pick the single best language to produce that inner content. Return JSON only:
{"id": "0166"}

If none fit, return {"id": null}`,
          },
        ],
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );

    const text = response.data?.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { inner: null };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const innerLang = parsed?.id;
    if (!innerLang || !candidates.find((l) => l.id === innerLang)) {
      return { inner: null };
    }

    return { inner: { lang: innerLang, prompt: innerNeed } };
  } catch (error) {
    console.error("[language-router] planInnerForRequest error:", error.message);
    return { inner: null };
  }
}
