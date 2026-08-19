import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { TokenUsage } from "./llm-generation-service";

export type Stage =
  | "code_gen"
  | "repair"
  | "route_scope_gate"
  | "route_rescope"
  | "compose_plan"
  | "spec_gen"
  | "judge";

interface RecordTokenUsageArgs {
  auth: { uid: string };
  rid: string;
  stage: Stage;
  itemId: string | null;
  generatedTaskId?: string | null;
  lang?: string | null;
  provider: "anthropic" | "openai";
  model: string;
  tier?: string | null;
  usage: TokenUsage;
  extra?: Record<string, unknown>;
}

interface BackfillArgs {
  auth: { uid: string };
  rid: string;
  itemId: string;
}

const db = getFirestore();

export async function recordTokenUsage({
  auth,
  rid,
  stage,
  itemId,
  generatedTaskId,
  lang,
  provider,
  model,
  tier,
  usage,
  extra,
}: RecordTokenUsageArgs): Promise<void> {
  // No-op if no tokens spent (including cache reads, which bill at 0.1×)
  if (
    usage.inputTokens +
    usage.outputTokens +
    usage.cacheCreationInputTokens +
    usage.cacheReadInputTokens ===
    0
  ) {
    return;
  }

  try {
    const now = new Date();
    const doc = {
      userId: auth.uid,
      taskId: rid, // Pre-existing field name; holds the request id
      rid,
      itemId: itemId ?? null,
      generatedTaskId: generatedTaskId ?? null,
      stage,
      units: 0, // Always 0 for telemetry-only docs (never billed)
      createdAt: Timestamp.now(),
      timestamp: now.toISOString(),
      lang: lang ?? null,
      type: "ai_generation",
      provider,
      tier: tier ?? null,
      model,
      tokens: {
        input: usage.inputTokens,
        output: usage.outputTokens,
        total: usage.inputTokens + usage.outputTokens,
        cacheCreation: usage.cacheCreationInputTokens,
        cacheRead: usage.cacheReadInputTokens,
        reasoning: usage.reasoningTokens,
      },
      ...extra,
    };

    // Write flat log
    await db.collection("usage").add(doc);

    // Write/update item-doc rollup if itemId is known
    if (itemId) {
      await updateItemTokenUsage(auth.uid, itemId, usage, model, stage);
    }
  } catch (error) {
    console.error("[token-usage-service] Failed to record token usage:", error);
    // Never throw — telemetry failures should not fail the generation
  }
}

async function updateItemTokenUsage(
  uid: string,
  itemId: string,
  usage: TokenUsage,
  model: string,
  stage: Stage
): Promise<void> {
  try {
    const itemRef = db.collection(`users/${uid}/items`).doc(itemId);

    // Use set with merge: true to create the doc if absent (needed for items created via
    // generation, where the doc ref is allocated before the doc exists). Nested objects inside
    // a map are not parsed for dots, so model ids like "gpt-5.6-terra" work as literal keys.
    await itemRef.set(
      {
        tokenUsage: {
          totals: {
            input: FieldValue.increment(usage.inputTokens),
            output: FieldValue.increment(usage.outputTokens),
            cacheCreation: FieldValue.increment(usage.cacheCreationInputTokens),
            cacheRead: FieldValue.increment(usage.cacheReadInputTokens),
          },
          byModel: {
            [model]: {
              input: FieldValue.increment(usage.inputTokens),
              output: FieldValue.increment(usage.outputTokens),
              cacheCreation: FieldValue.increment(usage.cacheCreationInputTokens),
              cacheRead: FieldValue.increment(usage.cacheReadInputTokens),
            },
          },
          byStage: {
            [stage]: {
              input: FieldValue.increment(usage.inputTokens),
              output: FieldValue.increment(usage.outputTokens),
              cacheCreation: FieldValue.increment(usage.cacheCreationInputTokens),
              cacheRead: FieldValue.increment(usage.cacheReadInputTokens),
            },
          },
          updatedAt: Date.now(),
        },
      },
      { merge: true }
    );
  } catch (error) {
    // Swallow not-found (item deleted mid-flight) and other errors
    if ((error as any)?.code !== "not-found") {
      console.error("[token-usage-service] Failed to update item token usage:", error);
    }
  }
}

export async function backfillTokenUsageItemId({
  auth,
  rid,
  itemId,
}: BackfillArgs): Promise<void> {
  try {
    // Query for pre-item usage docs with this rid that haven't been attributed yet
    const snapshot = await db
      .collection("usage")
      .where("userId", "==", auth.uid)
      .where("rid", "==", rid)
      .where("itemId", "==", null)
      .get();

    if (snapshot.empty) {
      return;
    }

    // Update each doc to set itemId and roll up its tokens to the item
    for (const docSnap of snapshot.docs) {
      const doc = docSnap.data();
      const usage: TokenUsage = {
        inputTokens: doc.tokens?.input ?? 0,
        outputTokens: doc.tokens?.output ?? 0,
        cacheCreationInputTokens: doc.tokens?.cacheCreation ?? 0,
        cacheReadInputTokens: doc.tokens?.cacheRead ?? 0,
        reasoningTokens: doc.tokens?.reasoning ?? 0,
      };
      const model = doc.model as string;
      const stage = doc.stage as Stage;

      // Update the usage doc to link it to the item
      await docSnap.ref.update({ itemId });

      // Apply the rollup to the item
      await updateItemTokenUsage(auth.uid, itemId, usage, model, stage);
    }
  } catch (error) {
    console.error("[token-usage-service] Failed to backfill token usage:", error);
    // Don't throw — this runs after item creation, so it shouldn't block that path
  }
}
