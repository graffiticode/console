import { getLanguageScope, getLanguageServerDoc } from "./language-server-client";

export interface Language {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  routingHint?: string;
  domains: string[];
  status?: string;
  // Internal dialect (e.g. the L0010 composition planner). Registered so the
  // console recognizes it and can show its items for curation, but excluded
  // from the planner's candidate catalog (it must never propose itself).
  internal?: boolean;
  // Populated at runtime by listLanguages() from each lang server's
  // scope.json. The static `description` and `routingHint` above remain as
  // cold-start / unreachable-server fallbacks; once scope.json is universal
  // they'll be trimmed.
  summary?: string;
  inScope?: string[];
  outOfScope?: string[];
  // Vendor gate. A language that only makes sense for a named vendor/platform (its output
  // is that vendor's format) lists the gate terms here. Such a language is a legitimate
  // answer ONLY when the user named the vendor — never as the fallback for a generic
  // request that happens to share its item types. Enforced in listLanguages(): a gated
  // language is withheld from a `search` that doesn't name the gate, so its honest but
  // generic in_scope text ("multiple-choice items") can't pull it into a plain quiz
  // request. It stays reachable by naming the vendor, by domain-scoping to the gate
  // domain, or in the unfiltered full catalog.
  gatedBy?: string[];
  // Composition permission allowlist: the upstream dialects this language is ALLOWED to
  // compose with (consume/embed). This is the hard fence — the server's planner may only
  // propose edges within it; the client can never create an undeclared edge.
  //   - explicit list (e.g. ["0166"]) — may compose ONLY with those upstreams
  //   - ["*"] — may compose with any non-internal authoring language (e.g. a chart consuming
  //     any data provider)
  //   - absent / empty — ATOMIC ONLY (no composition)
  // See composesWithFor / fenceComposition in language-router.ts.
  composesWith?: string[];
}

export const LANGUAGES: Language[] = [
  { id: "0000", name: "L0000", description: "Root language", domains: [] },
  // L0001 is DEPRECATED — retained as a repo for historical reference only. Do not re-enable.
  // { id: "0002", name: "L0002", description: "Core language", domains: [] },
  { id: "0003", name: "L0003", description: "Hello, image, theme, and print", domains: [] },
  { id: "0010", name: "L0010", description: "Composition planner (internal)", routingHint: "Internal composition-planning dialect: maps a request to an ordered language sequence (`plan [...]` → { langs }). Not a content-authoring target.", domains: [], status: "Internal", internal: true },
  { id: "0013", name: "L0013", description: "Screenshot thumbnails (internal)", routingHint: "Internal utility dialect: renders an existing item's form view to a cropped PNG thumbnail and uploads it (`snap item \"<id>\" {}`). Not a content-authoring target.", domains: [], status: "Internal", internal: true },
  // { id: "0011", name: "L0011", description: "Property editors", domains: [] },
  // { id: "0012", name: "L0012", description: "Object viewers", domains: [] },
  // { id: "0137", name: "L0137", description: "Data transformers", domains: [] },
  // { id: "0146", name: "L0146", description: "SVG scrapers", domains: [] },
  // { id: "0147", name: "L0147", description: "Chart renderers", domains: [] },
  // { id: "0150", name: "L0150", description: "Free shipping calculators", domains: [] },
  // { id: "0151", name: "L0151", description: "Spreadsheets questions", domains: [] },
  { id: "0152", name: "L0152", description: "Interactive map questions", routingHint: "Interactive map-based questions — learners answer by clicking or identifying locations on a map (states, capitals, countries, regions).", domains: ["assessments"] },
  { id: "0153", name: "L0153", description: "Area model questions", routingHint: "Area model multiplication questions with visual grid representations.", domains: ["assessments"], status: "Beta" },
  { id: "0154", name: "L0154", description: "Magic square questions", routingHint: "Magic square puzzle questions with grid-based number placement.", domains: ["assessments"], status: "Beta" },
  // { id: "0155", name: "L0155", description: "Stoplight questions", domains: [] },
  // { id: "0156", name: "L0156", description: "Short text scorers", domains: [] },
  // { id: "0157", name: "L0157", description: "Geoboard manipulatives", domains: [] },
  { id: "0158", name: "L0158", description: "Learnosity assessment items (legacy; prefer L0176). Use ONLY when the user names Learnosity or a Learnosity Item Bank / LMS.", routingHint: "Do NOT use for generic quizzes, tests, or practice items that don't name Learnosity. Deprecated in favor of L0176 — prefer L0176 for all new Learnosity item content. Learnosity assessment items — MCQ, short text, cloze, formula, classification, order list, and choice matrix question types via Learnosity API. Embeds another Graffiticode dialect (e.g. L0166 spreadsheets) as a `custom` question for spreadsheet-based, table-based, or worksheet-style assessments.", domains: ["learnosity"], gatedBy: ["learnosity"], status: "Deprecated", composesWith: ["0166"] },
  { id: "0159", name: "L0159", description: "Flashcards, Match and Memory card games", routingHint: "Flashcard study decks, match games, and memory card games with LaTeX math support. Define fact pairs for card-based learning activities.", domains: ["assessments"] },
  // { id: "0160", name: "L0160", description: "Learnosity QTI Importer", domains: [] },
  // { id: "0161", name: "L0161", description: "Expression translators", domains: [] },
  // { id: "0162", name: "L0162", description: "Walking routes", domains: [] },
  // { id: "0163", name: "L0163", description: "Code editors", domains: [] },
  // { id: "0164", name: "L0164", description: "Code generators", domains: [] },
  { id: "0166", name: "L0166", description: "Spreadsheets", routingHint: "Interactive spreadsheet authoring with tabular cell data, cell-level formatting, formulas (SUM, AVERAGE, ROUND, IF), parameterized values, and optional assessment validation.", domains: ["assessments", "sheets"] },
  { id: "0169", name: "L0169", description: "Concept web assessments", routingHint: "Interactive concept web diagrams with central anchor, radial connections, custom edges, drag-and-drop concepts and relation labels, and node styling.", domains: ["assessments", "diagrams"] },
  { id: "0170", name: "L0170", description: "Fetch & transform data", routingHint: "The go-to provider for data acquisition and transformation. Fetches JSON/CSV from external/public web URLs (or accepts inline data) and transforms it (dplyr/jq-style): navigate nested data, filter/select/mutate/group/sort/take(top-N)/join/flatten/unique. Use as the upstream data source whenever another language (e.g. a chart) needs data fetched from the web or filtered/sorted/aggregated before use.", domains: [] },
  { id: "0171", name: "L0171", description: "Venn diagrams", routingHint: "Venn diagrams with named sets, intersections, elements, configurable overlap, and styling.", domains: ["diagrams"], status: "Beta" },
  { id: "0172", name: "L0172", description: "FigJam content", routingHint: "FigJam board content authoring.", domains: [] },
  { id: "0173", name: "L0173", description: "Charts", routingHint: "Apache ECharts visualizations (bar, line, pie/donut/nightingale rose, scatter). Supports multi-series and dual-axis compositions. Plots data given inline, or binds external data from an upstream data task via `data` — compose with an upstream data-providing language when the values must be fetched or transformed before plotting.", domains: [], composesWith: ["0170"] },
  { id: "0174", name: "L0174", description: "Web forms", routingHint: "Single-page web forms — ordered fields (text, email, number, tel, url, textarea, select, radio, checkbox, date), per-field validation (min/max, length, pattern, required), light/dark theming, and a submit affordance with thank-you/redirect. Submissions deliver to a bound webhook.", domains: [], status: "Beta" },
  { id: "0175", name: "L0175", description: "Grade 5 ELA assessments (SBAC Claim 1, Reasoning & Evidence): Target 4 literary texts and Target 11 informational texts", routingHint: "Composes 5th-grade English Language Arts assessment items (Smarter Balanced · Grade 5 · Claim 1 · Reasoning & Evidence) as EBSR, Hot Text, or Short Text. Supports two learning targets, selected by a top-level `target`: Target 4 (c1-t4) over LITERARY passages — character, setting, event, point of view, theme, narrator's feelings, character relationships (RL standards); and Target 11 (c1-t11) over INFORMATIONAL passages — relationships/interactions between ideas, the author's use of information and evidence, point of view, purpose, the author's opinion (RI standards). Authors, inline, candidate inference claims and evidence sources for a single passage (literary or informational).", domains: ["assessments"], status: "Beta" },
  { id: "0176", name: "L0176", description: "Learnosity assessment items — Learnosity-shaped JSON for a Learnosity Item Bank, Items API, or Learnosity-integrated LMS. Use ONLY when the user names Learnosity; not a general quiz language.", routingHint: "Do NOT use for generic quizzes, tests, or practice items that don't name Learnosity. Learnosity assessment items from natural language — MCQ, cloze/fill-in-the-blank, short/long text, choice matrix, ordering, classification, NGN/NCLEX bowtie, token-highlight (hot text), math fill-in, and custom items that embed another Graffiticode dialect (e.g. L0166 spreadsheets) as a `custom` question. Emits valid Learnosity item JSON.", domains: ["learnosity"], gatedBy: ["learnosity"], composesWith: ["0166"] },
  { id: "0177", name: "L0177", description: "Learnosity Author API integration — recipes for embedding/configuring integrated item/activity authoring experiences", routingHint: "Developer integration oracle for the Learnosity Author API. The client describes an authoring-experience integration design — embed the item editor (item_edit), item browser (item_list), activity editor (activity_edit), or activity list (activity_list), configured with allowed widget types, editor permissions, item bank, locked mode. L0177 validates the design, flags holes (missing serving domain, author user id, item reference) as steering warnings, and via get_spec returns a host-language-neutral recipe: goal, preconditions, procedure, gotchas, and verification steps. Does NOT author item content (that is L0176), does NOT do item-bank CRUD (Data API), and does NOT emit runnable code.", domains: ["learnosity", "integration"], gatedBy: ["learnosity"], status: "Beta" },
];

export function findLanguageById(id: string): Language | undefined {
  const normalized = id.replace(/^L/i, "").padStart(4, "0");
  return LANGUAGES.find(l => l.id === normalized);
}

export function selectLanguages(domain?: string): Language[] {
  if (!domain) return LANGUAGES;
  const d = domain.toLowerCase();
  return LANGUAGES.filter(lang => lang.domains.includes(d));
}

export async function listLanguages({ search, domain }: { search?: string; domain?: string }): Promise<Language[]> {
  let results = selectLanguages(domain);

  // Enrich each entry from the lang server in parallel:
  //   - scope.json → summary / inScope / outOfScope (routing-only descriptor)
  //   - language-info.json → longDescription
  // Both fetchers cache with a TTL; repeated calls are in-memory.
  results = await Promise.all(
    results.map(async (lang) => {
      const [scope, doc] = await Promise.all([
        getLanguageScope(lang.id),
        getLanguageServerDoc(lang.id),
      ]);
      const enriched: Language = { ...lang };
      if (scope) {
        enriched.summary = scope.summary;
        enriched.inScope = scope.in_scope;
        enriched.outOfScope = scope.out_of_scope;
      }
      if (doc.envelope?.description) {
        enriched.longDescription = doc.envelope.description;
      }
      return enriched;
    })
  );

  if (search) {
    const searchLower = search.toLowerCase();
    const domainLower = (domain || "").toLowerCase();
    results = results.filter(lang => {
      // A vendor-gated language answers a search only if the search names its gate
      // (or the caller already scoped to the gate's domain, which is itself the ask).
      // Its item-type text is generic by nature and would otherwise match any
      // un-branded question search.
      const gates = lang.gatedBy || [];
      if (gates.length > 0 &&
          !gates.includes(domainLower) &&
          !gates.some(g => searchLower.includes(g))) {
        return false;
      }
      return (
        lang.name.toLowerCase().includes(searchLower) ||
        lang.description.toLowerCase().includes(searchLower) ||
        (lang.longDescription || "").toLowerCase().includes(searchLower) ||
        (lang.summary || "").toLowerCase().includes(searchLower) ||
        (lang.inScope || []).some(s => s.toLowerCase().includes(searchLower))
      );
    });
  }

  return results;
}
