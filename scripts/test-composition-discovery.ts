// Verifies the AST-walk logic in src/lib/composition-discovery.ts using
// hand-built nodePools. Schema fetch is mocked via the injectable fetcher.
// Run: npx tsx scripts/test-composition-discovery.ts

import { resolveUpstreams } from "../src/lib/composition-discovery";

let failures = 0;
function assertEqual(label: string, actual: any, expected: any) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.log(`  ✗ ${label}\n    expected: ${e}\n    got:      ${a}`);
  }
}

async function assertThrows(label: string, fn: () => Promise<any>, messageSubstring: string) {
  try {
    await fn();
    failures++;
    console.log(`  ✗ ${label}: expected throw, got success`);
  } catch (e: any) {
    if (String(e.message).includes(messageSubstring)) {
      console.log(`  ✓ ${label}`);
    } else {
      failures++;
      console.log(`  ✗ ${label}: wrong error\n    expected substring: ${messageSubstring}\n    got: ${e.message}`);
    }
  }
}

function makeFetcher(responses: Record<string, string | null>) {
  return async (lang: string, file: string) => {
    const key = `${lang}/${file}`;
    return key in responses ? responses[key] : null;
  };
}

async function main() {
  console.log("\nresolveUpstreams");

  // 1: empty pool
  {
    const result = await resolveUpstreams(
      { root: 1, "1": { tag: "PROG", elts: [] } },
      makeFetcher({})
    );
    assertEqual("empty pool returns no upstreams", result.upstreams, []);
  }

  // 2: data {} no upstream hint
  {
    const pool = {
      root: 5,
      "1": { tag: "RECORD", elts: [] },
      "2": { tag: "DATA", elts: [1] },
      "5": { tag: "EXPRS", elts: [2] },
    };
    const result = await resolveUpstreams(pool, makeFetcher({}));
    assertEqual("data {} produces no upstream", result.upstreams, []);
    assertEqual("data {} ast unchanged", result.ast["2"], pool["2"]);
  }

  // 3: single data use "0166"
  {
    const fetcher = makeFetcher({ "L0166/schema.json": JSON.stringify({ type: "spreadsheet" }) });
    const pool = {
      root: 10,
      "3": { tag: "STR", elts: ["0166"] },
      "5": { tag: "USE", elts: [3] },
      "7": { tag: "DATA", elts: [5] },
      "9": { tag: "EXPRS", elts: [7] },
      "10": { tag: "PROG", elts: [9] },
    };
    const result = await resolveUpstreams(pool, fetcher);
    assertEqual("single use → ['0166']", result.upstreams, ["0166"]);
    assertEqual(
      "USE's STR child holds JSON-stringified schema",
      result.ast["3"].elts[0],
      JSON.stringify({ type: "spreadsheet" })
    );
    assertEqual("USE node itself is unchanged", result.ast["5"], pool["5"]);
    assertEqual("non-USE nodes are passed through", result.ast["7"], pool["7"]);
  }

  // 4: two data use calls preserve scan order (use disjoint langs to avoid
  // cache hits from test 3)
  {
    const fetcher = makeFetcher({
      "L0167/schema.json": JSON.stringify({ type: "ss" }),
      "L0159/schema.json": JSON.stringify({ type: "fc" }),
    });
    const pool: any = {
      root: 20,
      "1": { tag: "STR", elts: ["0167"] },
      "2": { tag: "USE", elts: [1] },
      "3": { tag: "DATA", elts: [2] },
      "4": { tag: "STR", elts: ["0159"] },
      "5": { tag: "USE", elts: [4] },
      "6": { tag: "DATA", elts: [5] },
      "20": { tag: "EXPRS", elts: [3, 6] },
    };
    const result = await resolveUpstreams(pool, fetcher);
    assertEqual("two uses → ['0167','0159']", result.upstreams, ["0167", "0159"]);
    assertEqual(
      "first STR rewritten with schema JSON",
      result.ast["1"].elts[0],
      JSON.stringify({ type: "ss" })
    );
    assertEqual(
      "second STR rewritten with schema JSON",
      result.ast["4"].elts[0],
      JSON.stringify({ type: "fc" })
    );
  }

  // 5: missing schema → error
  {
    const pool = {
      root: 10,
      "3": { tag: "STR", elts: ["9999"] },
      "5": { tag: "USE", elts: [3] },
      "7": { tag: "DATA", elts: [5] },
      "10": { tag: "EXPRS", elts: [7] },
    };
    await assertThrows(
      "missing schema → error",
      () => resolveUpstreams(pool, makeFetcher({})),
      "L9999 has no accessible schema.json"
    );
  }

  // 6: invalid lang id → error
  {
    const pool = {
      root: 10,
      "3": { tag: "STR", elts: ["not-a-lang"] },
      "5": { tag: "USE", elts: [3] },
      "7": { tag: "DATA", elts: [5] },
      "10": { tag: "EXPRS", elts: [7] },
    };
    await assertThrows(
      "invalid lang id → error",
      () => resolveUpstreams(pool, makeFetcher({})),
      "must be a language id"
    );
  }

  // 7: use without surrounding data → ignored
  {
    const pool = {
      root: 10,
      "3": { tag: "STR", elts: ["0166"] },
      "5": { tag: "USE", elts: [3] },
      "10": { tag: "EXPRS", elts: [5] },
    };
    const result = await resolveUpstreams(pool, makeFetcher({}));
    assertEqual("USE without DATA parent is ignored", result.upstreams, []);
  }

  console.log(failures === 0 ? "\nAll tests passed.\n" : `\n${failures} test(s) failed.\n`);
  if (failures > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
