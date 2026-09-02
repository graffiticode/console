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
  // Withheld from the CATALOG — the `languages` query and the planner's candidate
  // list — while still registered everywhere else. A language lands here when it
  // works well enough to keep authoring but not well enough to be recruited for:
  // its output can't be finished from a chat (L0172 needs a human to wire up the
  // Figma side) or it isn't done (L0174).
  //
  // Deliberately NOT `selectLanguages()`, which drives the console's own signed-in
  // picker and tools gallery — hiding a language from discovery must not take it
  // away from the person still building it. findLanguageById also keeps answering,
  // so existing items render and `language(id)` still resolves.
  hidden?: boolean;
  // Populated from each lang server's scope.json, but ONLY when a caller asks for
  // it with `listLanguages({ enrich: true })` — the catalog listing does not.
  //
  // This reverses an earlier intent recorded here, that scope.json would become
  // universal and the static `description`/`routingHint` would then be trimmed.
  // Listing and detail are deliberately different surfaces now: listing answers
  // "what exists" from static metadata and must be fast enough to route against,
  // while scope.json stays authoritative for single-language detail via
  // getLanguageInfo(). Making the listing depend on ~19 other services to answer
  // is what took it to 57-75s. If this text should ever be authoritative for
  // listing too, publish it INTO the catalog at language-deploy time rather than
  // fetching it on every read.
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
  // Anonymous free-plan (MCP trial) scope. Marking ANY language with this turns
  // the trial into an allowlist: only marked languages may be created without an
  // account, and everything else returns a structured
  // `language_not_in_trial_scope` listing what is allowed.
  //
  // Ships inert on purpose. With nothing marked the gate is a no-op, so
  // deploying it can't silently take languages away from trial users mid-task;
  // enabling it is then a reversible data change (mark the set) rather than a
  // release. See freePlanLanguageIds() / isLanguageInFreePlanScope().
  freePlan?: boolean;
  // Sponsored: items created in this language are free to the customer — not
  // metered to Stripe and not counted against the plan allowance. Used to carry
  // the cost of a language we're promoting.
  //
  // Distinct from `freePlan` above, and the two answer different questions:
  // `freePlan` asks "may an ANONYMOUS caller create this at all", `sponsored`
  // asks "who pays for it once created". They compose without interacting — an
  // anonymous trial item in a sponsored language is simply free twice over.
  //
  // Uncapped by design: while this is set, every item in the language is free,
  // and ending a sponsorship is a flag flip after which items bill normally with
  // no wall and no notice. There is deliberately no per-user or global budget
  // yet; usage rows carry a `sponsorId` so one can be added later and evaluated
  // against history that already exists.
  //
  // Safe as a LANGUAGE flag specifically because the server decides an item's
  // language (the scope gate re-routes a mis-labelled request), so a caller
  // cannot elect into it. The same idea keyed on `client` would be a billing
  // bypass — `client` is caller-supplied. See isLanguageSponsored().
  //
  // `by` is the sponsor's display name, shown to the customer on the Usage tab —
  // attribution is most of the point of sponsoring. An object rather than a bare
  // boolean because that is also where a budget lands if sponsorship ever gains
  // one (`{ by, items }`), with no call-site churn.
  sponsored?: { by: string };
}

export const LANGUAGES: Language[] = [
  { id: "0000", name: "L0000", description: "Root language", domains: [], sponsored: { by: "Artcompiler Inc." } },
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
  { id: "0158", name: "L0158", description: "Learnosity assessment items (legacy; prefer L0176). Use ONLY when the user names Learnosity or a Learnosity Item Bank / LMS.", routingHint: "Do NOT use for generic quizzes, tests, or practice items that don't name Learnosity. Deprecated in favor of L0176 — prefer L0176 for all new Learnosity item content. Learnosity assessment items — MCQ, short text, cloze, formula, classification, order list, and choice matrix question types via Learnosity API. Embeds another Graffiticode dialect (e.g. L0166 spreadsheets) as a `custom` question for spreadsheet-based, table-based, or worksheet-style assessments.", domains: ["learnosity"], gatedBy: ["learnosity"], status: "Deprecated", composesWith: ["0166", "0179"] },
  // Flashcards moved to L0181 — same study loop, rebuilt on L0000. L0159 keeps match and
  // memory, which L0181 does not do, and keeps serving every item already authored in it.
  { id: "0159", name: "L0159", description: "Match and Memory card games", routingHint: "Matching games, where a player pairs related terms, and memory (concentration) card games, where a player flips hidden cards to find pairs. Both are driven by a list of two-sided fact pairs, with LaTeX math support. For a FLASHCARD deck — cards a learner flips and rates one at a time — use L0181, not this.", domains: ["assessments"] },
  // { id: "0160", name: "L0160", description: "Learnosity QTI Importer", domains: [] },
  // { id: "0161", name: "L0161", description: "Expression translators", domains: [] },
  // { id: "0162", name: "L0162", description: "Walking routes", domains: [] },
  // { id: "0163", name: "L0163", description: "Code editors", domains: [] },
  // { id: "0164", name: "L0164", description: "Code generators", domains: [] },
  // Deprecated 2026-08-26 in favour of L0179, which compiles to the same form from a cleaner
  // surface. Still registered, still routable, and still the composition target for L0158/L0176 —
  // deprecation steers new work without stranding the items or the embeddings that exist. The
  // steer lives in the TEXT, since `status` is only a label and filters nothing (see L0158).
  { id: "0166", name: "L0166", description: "Spreadsheets (legacy; prefer L0179)", routingHint: "Deprecated in favor of L0179 — prefer L0179 for all new spreadsheet content; it emits the same compiled form and rejects several mistakes this dialect accepts silently. Interactive spreadsheet authoring with tabular cell data, cell-level formatting, formulas (SUM, AVERAGE, ROUND, IF), parameterized values, and optional assessment validation.", domains: ["assessments", "sheets"], status: "Deprecated" },
  { id: "0169", name: "L0169", description: "Concept web assessments", routingHint: "Interactive concept web diagrams with central anchor, radial connections, custom edges, drag-and-drop concepts and relation labels, and node styling.", domains: ["assessments", "diagrams"] },
  { id: "0170", name: "L0170", description: "Fetch & transform data", routingHint: "The go-to provider for data acquisition and transformation. Fetches JSON/CSV from external/public web URLs (or accepts inline data) and transforms it (dplyr/jq-style): navigate nested data, filter/select/mutate/group/sort/take(top-N)/join/flatten/unique. Use as the upstream data source whenever another language (e.g. a chart) needs data fetched from the web or filtered/sorted/aggregated before use.", domains: [] },
  { id: "0171", name: "L0171", description: "Venn diagrams", routingHint: "Venn diagrams with named sets, intersections, elements, configurable overlap, and styling.", domains: ["diagrams"], status: "Beta", hidden: true },
  { id: "0172", name: "L0172", description: "FigJam content", routingHint: "FigJam board content authoring.", domains: [], hidden: true },
  { id: "0173", name: "L0173", description: "Charts", routingHint: "Apache ECharts visualizations (bar, line, pie/donut/nightingale rose, scatter). Supports multi-series and dual-axis compositions. Plots data given inline, or binds external data from an upstream data task via `data` — compose with an upstream data-providing language when the values must be fetched or transformed before plotting.", domains: [], composesWith: ["0170"] },
  { id: "0174", name: "L0174", description: "Web forms", routingHint: "Single-page web forms — ordered fields (text, email, number, tel, url, textarea, select, radio, checkbox, date), per-field validation (min/max, length, pattern, required), light/dark theming, and a submit affordance with thank-you/redirect. Submissions deliver to a bound webhook.", domains: [], status: "Beta", hidden: true },
  { id: "0175", name: "L0175", description: "Grade 5 ELA assessments (SBAC Claim 1, Reasoning & Evidence): Target 4 literary texts and Target 11 informational texts", routingHint: "Composes 5th-grade English Language Arts assessment items (Smarter Balanced · Grade 5 · Claim 1 · Reasoning & Evidence) as EBSR, Hot Text, or Short Text. Supports two learning targets, selected by a top-level `target`: Target 4 (c1-t4) over LITERARY passages — character, setting, event, point of view, theme, narrator's feelings, character relationships (RL standards); and Target 11 (c1-t11) over INFORMATIONAL passages — relationships/interactions between ideas, the author's use of information and evidence, point of view, purpose, the author's opinion (RI standards). Authors, inline, candidate inference claims and evidence sources for a single passage (literary or informational).", domains: ["assessments"], status: "Beta" },
  { id: "0176", name: "L0176", description: "Learnosity assessment items — Learnosity-shaped JSON for a Learnosity Item Bank, Items API, or Learnosity-integrated LMS. Use ONLY when the user names Learnosity; not a general quiz language.", routingHint: "Do NOT use for generic quizzes, tests, or practice items that don't name Learnosity. Learnosity assessment items from natural language — MCQ, cloze/fill-in-the-blank, short/long text, choice matrix, ordering, classification, NGN/NCLEX bowtie, token-highlight (hot text), math fill-in, and custom items that embed another Graffiticode dialect (e.g. L0179 spreadsheets) as a `custom` question. Emits valid Learnosity item JSON.", domains: ["learnosity"], gatedBy: ["learnosity"], composesWith: ["0166", "0179"] },
  { id: "0177", name: "L0177", description: "Learnosity Author API integration — recipes for embedding/configuring an item/activity authoring UX. The UX view of a Learnosity Item bank; for programmatic access to the same data, see L0178.", routingHint: "Pick on this axis: L0177 is \"I want a UX of the data\" (a person authoring in a browser); L0178 is \"I want the data\" (a program reading or writing the bank server-to-server). Same Item bank, two views. Developer integration oracle for the Learnosity Author API. The client describes an authoring-experience integration design — embed the item editor (item_edit), item browser (item_list), activity editor (activity_edit), or activity list (activity_list), configured with allowed widget types, editor permissions, item bank, locked mode. L0177 validates the design, flags holes (missing serving domain, author user id, item reference) as steering warnings, and via get_spec returns a host-language-neutral recipe: goal, preconditions, procedure, gotchas, and verification steps. Does NOT author item content (that is L0176, which composes the payload), and does NOT do programmatic item-bank access — extraction, bulk load, or any server-to-server read/write is L0178. Does NOT emit runnable code.", domains: ["learnosity", "integration"], gatedBy: ["learnosity"], status: "Beta" },
  { id: "0178", name: "L0178", description: "Learnosity Data API cookbook — the DATA plane: recipes for reading and writing a Learnosity Item bank and its assessment results, server-to-server. Use ONLY when the user names Learnosity.", routingHint: "Pick on this axis: L0178 is \"I want the data\" (a program reading or writing server-to-server); a UX over that same data is a different dialect — authoring is L0177, rendered reports are unbuilt. Developer cookbook for the Learnosity Data API, the data plane for the Learnosity dialects. The client describes a data job — which operation, what the request carries, and how far it reads — and L0178 validates it, flags holes as steering warnings, and via get_spec returns a host-language-neutral recipe: goal, preconditions, procedure, a dedicated paging section, gotchas, and verification steps. EARLY: 9 of 57 operations are modelled — reading Items from an Item bank (itembank/items get), WRITING Items to it (itembank/items set), setting and updating Item tags (itembank/items/tags set and update), reading session responses (sessions/responses get), submitting sessions from a template or as failed submissions (sessions set, two operations branched on data_format), polling the async job channel (jobs get), and building an offline package (itembank/offlinepackage get, which is asynchronous). Duplicates, deletes, and the remaining sessions and reports endpoints are NOT built — do not route those here; say no dialect covers them yet. The two session submissions are modelled from documentation only and not yet exercised against a live consumer; everything else is verified. On writes it carries two hazards the reference never states: set REPLACES rather than merging, so anything omitted from the payload is cleared and the response echoes nothing to warn you; and the VERB does not predict which — the same tags endpoint replaces under set and merges under update, documented identically. Its focus is the truncated read: a short result set returns HTTP 200 with a well-formed body, and meta.records counts the page rather than the total, so a paged job must declare whether it reads one page or to exhaustion. There is no universal paging loop — on itembank/* the cursor disappears at exhaustion, while on sessions/* it is always present and an empty page is the end signal, so each family's rule is a bug in the other. Does NOT author item content (that is L0176, which composes the payload this dialect transports — L0176 composes, L0178 moves, L0177 renders). Does NOT cover any UX over the data: the authoring experience is L0177 and a rendered report is an unbuilt dialect, so if the ask is something a person looks at rather than data a program consumes, say no dialect covers it. Naming hazard: the Data API's reports/datasets endpoints are in scope here and are NOT the Reports API. Does NOT call any Learnosity API, and does NOT emit runnable code.", domains: ["learnosity", "integration"], gatedBy: ["learnosity"], status: "Beta" },
  // L0179 supersedes L0166 (deprecated above): same compiled output, an attribute-list surface
  // instead of chained attributes (docs/language-authoring-style.md), and compile errors where
  // L0166 silently drops a value — misplaced attributes, wrong argument types, a sheet with no
  // cells. Routable since 2026-08-26; L0166 stays registered for the items already authored in it.
  //
  // A composition target for L0176 since 2026-08-27: L0158/L0176 embed a spreadsheet as a
  // `custom` question that loads the language's own scorer.js and question.js, and l0179 now
  // serves both (verified live: it registers `LearnosityAmd.define([],function(){return{Scorer:...}})`
  // exactly as l0166 does). L0176 therefore permits BOTH — `["0166", "0179"]` — so items already
  // authored against L0166 keep composing while new ones reach L0179. L0158 permits both for
  // the same reason: its buildCustom templates the whole asset triple off the language id
  // (`https://l${lang}.graffiticode.org/{question,scorer}.js` + `/question.css`, and
  // `custom_question_l${lang}`), so the pairing is capability, not policy — every 0166 in
  // l0158 is an error-message example or a test fixture. Deprecating a HOST is not a reason
  // to pin it to a deprecated UPSTREAM: doing so left an L0158 spreadsheet request choosing
  // between the dead dialect and, once a plan named L0179, a chain fenced to atomic.
  //
  // eval 2026-08-25 (l0179/docs/eval-2026-08-25.md, two sweeps of 144 runs): all four variants
  // compile 100% on both, so no MODEL_PRIORITY line — the fast models are within noise of each
  // other. The controlled sweep (L0166's own cases run against L0179, near-identical retrieval)
  // found the style neither helps nor hurts generation rate; what it buys is correctness a
  // compile-rate sweep cannot see.
  { id: "0179", name: "L0179", description: "Spreadsheets", routingHint: "Interactive spreadsheet authoring with tabular cell data, cell-level formatting, formulas (SUM, AVERAGE, ROUND, IF), parameterized values, and optional assessment validation with per-cell points. Supersedes L0166 — prefer this for all new spreadsheet content.", domains: ["assessments", "sheets"], status: "Beta" },
  // The ungated general assessment language. Until this entry existed the catalog had none:
  // L0176 authors the item types generically but is gatedBy learnosity, and L0175 is
  // Grade-5-ELA-only, so a plain "make me a five-question quiz" had nowhere to route and the
  // routing eval recorded 9 no-calls across 9 runs — correct behaviour against a catalog with
  // no match, not a routing bug. L0180 is the match.
  //
  // Deliberately NOT gatedBy anything: being reachable from a generic quiz request is the
  // whole point, and it is where L0176's `when_to_use` has always been steering generic asks.
  //
  // COVERAGE IS THREE INTERACTIONS, plus a wrapper. Choice — single-select, multi-select and
  // true/false, with per-option points, weighted answers, penalized distractors, exact-set
  // ("all or nothing") scoring, and a rationale per wrong answer. Hottext — clicking a sentence
  // or a word inside the passage itself, including "click any three of these". Extended-text —
  // a written response COLLECTED but never auto-scored: it ships its rubric and comes back
  // pending, for a person to mark. The `item` wrapper adds a reading passage and several parts
  // scored together, so EBSR-style two-part evidence items ARE in scope. Inline text entry,
  // ordering, matching, classification, hotspot and sliders are NOT built. The routingHint says so, because a model that routes an ordering
  // item here gets a compile error rather than an approximation.
  { id: "0180", name: "L0180", description: "Quizzes and assessment items", routingHint: "The general-purpose assessment language: use it for a quiz, quizzes, tests, exams, practice questions, comprehension checks and self-checks whenever no particular vendor or platform is named. Authors a single assessment item that renders and scores in a browser with no assessment platform behind it — multiple choice, multi-select (\"select all that apply\") and true/false, with per-option points, weighted answers, partial credit, penalized distractors, shuffled options, and unscored polls. Compiles the presentation and the answer key as separate halves, so a graded delivery can withhold the key and score server-side. Also authors multi-part items over a reading passage — a stimulus with numbered paragraphs and several questions scored together, either summed or conjunctively (every part right or the item earns nothing), which is the EBSR two-part evidence shape. Multi-select can score per-option for partial credit or as an exact set, where every correct option and nothing else earns the point. Also authors hot text, where the candidate clicks inside the passage itself rather than picking from a list — a sentence that supports an inference, any three of several that fit, or a single word in a vocabulary item, with the passage rendered once and its sentences clickable. Also authors written responses: extended-text collects a constructed response and ships the rubric it will be marked against, but nothing scores prose — the result comes back pending for a person to settle, which is what a short-text or explain-your-answer item needs. EARLY: choice, hot text and written responses ONLY. Inline text entry / fill-in-the-blank, ordering, matching, classification, hotspot and sliders are not built yet, and neither is a cloze passage with blanks inside running text — do not route those here; say no dialect covers them yet rather than substituting a choice item. If the user names Learnosity, that is L0176, not this.", domains: ["assessments"], status: "Beta" },
  // L0181 supersedes L0159's flashcards mode: same study loop (flip, rate, re-run the
  // stack that did not stick), rebuilt on L0000, with next/previous that work and math
  // confined to what the author delimited. L0159 keeps match and memory; its routingHint
  // below no longer claims flashcards, so the two do not compete for the same request.
  { id: "0181", name: "L0181", description: "Flashcard study decks", routingHint: "Flashcard study decks: two-sided cards a learner flips one at a time and rates \"I got this\" or \"I need more practice\", which sorts the deck into stacks so a second pass can be only the cards that did not stick. Route here for \"flashcards\", \"a deck of cards to study\", \"cards with the term on the front and the definition on the back\", vocabulary drills, formula drills and picture identification. A card side may be prose, LaTeX math wrapped in $...$, or an image URL, so it suits language vocabulary, historical dates, algebra identities and flags equally. Flashcards ONLY: matching games and memory (concentration) card games are L0159. It is not a scored assessment — a rating is the learner's own judgement, not a grade; use L0180 for quizzes and answer keys. No spaced repetition scheduling, and the deck is literal in the program rather than fetched from a data source.", domains: ["assessments"], status: "Beta" },
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

/**
 * The catalog listing.
 *
 * `enrich` fans out to every candidate language server for scope.json and
 * language-info.json. It is OFF by default, and the default is the whole point:
 * that fan-out is three HTTP fetches per language — ~57 across the catalog —
 * so a listing's latency is the latency of the SLOWEST language server, and a
 * cold one cost 57-75s in production. (These go through fetchText/assetUrlFor,
 * which unlike getLanguageAsset adds no cache-buster, so some are CDN hits; the
 * request count is the problem, not a guaranteed origin round-trip each time.)
 *
 * Three facts make the unenriched default correct rather than merely cheaper:
 *   - The GraphQL `Language` type exposes only id/name/description/routingHint/
 *     domains, so every external caller (the MCP server included) has ALWAYS had
 *     the enriched fields dropped from its response. The work was already invisible.
 *   - The search block below runs AFTER enrichment, so even a one-result search
 *     paid the full fan-out.
 *   - listLanguages reads only `envelope.description` from the doc fetch, while
 *     getLanguageServerDoc also pulls the whole usage-guide.md (3-18KB each) —
 *     fetched and discarded on every listing.
 *
 * Pass `enrich: true` only where the richer scope text actually changes a decision
 * and the latency is affordable: language-router.ts builds the planner prompt from
 * it, on the create path, which already runs 60-110s. Single-language detail does
 * NOT come through here at all — getLanguageInfo() in pages/api/languages.ts does
 * its own fetch for one language, which is where remote docs belong.
 */
export async function listLanguages({ search, domain, enrich = false }: { search?: string; domain?: string; enrich?: boolean }): Promise<Language[]> {
  // `hidden` is applied here rather than in selectLanguages() so the console's own
  // picker keeps showing these while the catalog stops offering them. See the field.
  let results = selectLanguages(domain).filter(lang => !lang.hidden);

  // Enrich each entry from the lang server in parallel:
  //   - scope.json → summary / inScope / outOfScope (routing-only descriptor)
  //   - language-info.json → longDescription
  // Both fetchers cache with a TTL; repeated calls are in-memory.
  if (enrich) results = await Promise.all(
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
    const tokens = searchTokens(search);

    const scored = results
      .filter(lang => {
        // A vendor-gated language answers a search only if the search names its gate
        // (or the caller already scoped to the gate's domain, which is itself the ask).
        // Its item-type text is generic by nature and would otherwise match any
        // un-branded question search. Deliberately still tested against the RAW
        // phrase: naming the vendor anywhere in the query is the gate, and
        // tokenizing must not widen what counts as naming it.
        const gates = lang.gatedBy || [];
        return !(gates.length > 0 &&
          !gates.includes(domainLower) &&
          !gates.some(g => searchLower.includes(g)));
      })
      .map(lang => ({ lang, score: scoreLanguage(lang, tokens) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    // Ranked, and capped. Uncapped OR-matching hands back most of the catalog for
    // a query with one common word, which reads as "everything fits" and invites
    // the nearest-match failure eval-routing.ts exists to catch. A caller that
    // wants the whole catalog omits `search` — which is what agents already do
    // when a search disappoints them.
    results = scored.slice(0, SEARCH_LIMIT).map(({ lang }) => lang);
  }

  return results;
}

/** Ranked-search result ceiling. See the cap note in listLanguages(). */
const SEARCH_LIMIT = 8;

/**
 * Words that describe nearly every language here, or nothing at all.
 *
 * "interactive" is in this list because it appears in most routing hints — as a
 * query token it selects the catalog rather than narrowing it.
 */
const STOPWORDS = new Set([
  "a", "an", "and", "the", "of", "for", "to", "in", "on", "with", "from", "by", "or",
  "my", "our", "their", "this", "that", "these", "those", "it", "its",
  "make", "create", "build", "generate", "author", "want", "need", "please",
  "interactive", "activity", "activities", "app", "thing", "something", "content",
]);

/**
 * Split a query into matchable terms.
 *
 * The old matcher tested the whole phrase as one substring, so any multi-word
 * query — which is what agents overwhelmingly send — matched nothing unless it
 * appeared verbatim. A fit eval over 28 prompts sent 36 distinct searches that
 * returned zero; 17 were multi-word, including "bar chart" against a charts
 * language whose description says "bar". Zero results is the worst possible
 * answer: the agent concludes the capability doesn't exist and stops.
 */
export function searchTokens(search: string): string[] {
  return [
    ...new Set(
      search
        .toLowerCase()
        .split(/[^a-z0-9+]+/)
        .filter(t => t.length > 1 && !STOPWORDS.has(t)),
    ),
  ];
}

/** Whole-word match, so "form" stops matching inside "transform". */
function hasWord(haystack: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Plurals are the same ask: "forms" must reach a language that says "form".
  return new RegExp(`\\b${escaped}(s|es)?\\b`, "i").test(haystack);
}

/**
 * How well a language answers a query: one point per distinct query term it
 * matches, doubled for a term in its name or one-line description, since those
 * are what the language IS rather than what it happens to mention.
 *
 * ANY term scoring is deliberate. Requiring every term would reproduce the
 * failure this replaces — a user's phrasing carries words no catalog entry uses
 * ("students", "shade", "6th grade"), and one unmatched word should not erase a
 * language that answers the rest.
 */
function scoreLanguage(lang: Language, tokens: string[]): number {
  if (!tokens.length) return 1; // punctuation-only query: don't filter anything out
  const primary = `${lang.name} ${lang.description}`;
  const secondary = [lang.longDescription, lang.routingHint, lang.summary, ...(lang.inScope || [])]
    .filter(Boolean)
    .join(" ");
  let score = 0;
  for (const t of tokens) {
    if (hasWord(primary, t)) score += 2;
    else if (hasWord(secondary, t)) score += 1;
  }
  return score;
}

/**
 * Language ids inside the anonymous free-plan scope, or an empty array when the
 * allowlist is inert (nothing marked) — see `freePlan` on the Language type.
 */
export function freePlanLanguageIds(): string[] {
  return LANGUAGES.filter(l => l.freePlan).map(l => l.id);
}

/**
 * Whether a language may be created on the anonymous free plan.
 *
 * Permissive while the allowlist is empty, so the gate can ship before anyone
 * has decided which languages belong in it. Once ANY language is marked, this
 * becomes a strict allowlist.
 */
export function isLanguageInFreePlanScope(lang: string | undefined | null): boolean {
  const allowed = freePlanLanguageIds();
  if (allowed.length === 0) return true;
  if (!lang) return false;
  // Callers pass either "0166" or "L0166".
  const id = String(lang).replace(/^L/i, "");
  return allowed.includes(id);
}

/**
 * Language ids whose items are currently sponsored — see `sponsored` on the
 * Language type. Empty when no sponsorship is running, which is the default.
 */
export function sponsoredLanguageIds(): string[] {
  return LANGUAGES.filter(l => l.sponsored).map(l => l.id);
}

/**
 * Whether items in this language are sponsored (free to the customer).
 *
 * Note the polarity is the opposite of isLanguageInFreePlanScope: an empty set
 * means nothing is sponsored, never "everything is". A permissive default here
 * would zero out every bill.
 */
export function isLanguageSponsored(lang: string | undefined | null): boolean {
  return languageSponsor(lang) !== null;
}

/**
 * Who is paying for items in this language, or null when nobody is.
 *
 * Customer-facing text, so it is a display name and not an id.
 */
export function languageSponsor(lang: string | undefined | null): string | null {
  if (!lang) return null;
  // Callers pass either "0166" or "L0166".
  const id = String(lang).replace(/^L/i, "");
  return LANGUAGES.find(l => l.id === id)?.sponsored?.by ?? null;
}
