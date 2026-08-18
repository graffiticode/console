import { getFirestore, FieldValue, FieldPath } from "firebase-admin/firestore";
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
  // No-op if no tokens spent
  if (usage.inputTokens + usage.outputTokens === 0) {
    return;
  }

  try {
    const now = Date.now();
    const doc = {
      userId: auth.uid,
      taskId: rid, // Pre-existing field name; holds the request id
      rid,
      itemId: itemId ?? null,
      generatedTaskId: generatedTaskId ?? null,
      stage,
      units: 0, // Always 0 for telemetry-only docs (never billed)
      createdAt: now,
      timestamp: new Date(now).toISOString(),
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

    // Build FieldPath-safe paths for model/stage breakdown (handles models with dots like "gpt-5.6-terra")
    const updates: Record<string, unknown> = {
      "tokenUsage.updatedAt": Date.now(),
    };

    // totals
    updates[
      FieldPath.documentId().toString().replace("__name__", "tokenUsage.totals.input")
    ] = FieldValue.increment(usage.inputTokens);

    // Use dot notation for nested keys, but for model ids use FieldPath.of() to avoid splitting on dots
    const totalsFields = [
      { key: "input", value: usage.inputTokens },
      { key: "output", value: usage.outputTokens },
      { key: "cacheCreation", value: usage.cacheCreationInputTokens },
      { key: "cacheRead", value: usage.cacheReadInputTokens },
    ];

    for (const { key, value } of totalsFields) {
      updates[`tokenUsage.totals.${key}`] = FieldValue.increment(value);
    }

    // byModel (use FieldPath.of for model id to handle dots safely)
    for (const { key, value } of totalsFields) {
      const fieldPath = FieldPath.documentId().toString();
      // Actually, FieldPath doesn't work like that. We need to use update with path strings
      // Firestore's update() doesn't support FieldPath for increment operations in the way we need
      // Let's use a custom approach that builds the path string safely
    }

    // For simplicity and correctness, rebuild the updates to use safe path construction
    const safeUpdates: { [key: string]: FieldValue | number } = {};

    // totals
    safeUpdates["tokenUsage.totals.input"] = FieldValue.increment(usage.inputTokens);
    safeUpdates["tokenUsage.totals.output"] = FieldValue.increment(usage.outputTokens);
    safeUpdates["tokenUsage.totals.cacheCreation"] = FieldValue.increment(
      usage.cacheCreationInputTokens
    );
    safeUpdates["tokenUsage.totals.cacheRead"] = FieldValue.increment(usage.cacheReadInputTokens);

    // byModel — MUST use FieldPath.of() to safely handle dots in model ids
    const modelPathInput = new FieldPath("tokenUsage", "byModel", model, "input");
    const modelPathOutput = new FieldPath("tokenUsage", "byModel", model, "output");
    const modelPathCacheCreation = new FieldPath(
      "tokenUsage",
      "byModel",
      model,
      "cacheCreation"
    );
    const modelPathCacheRead = new FieldPath("tokenUsage", "byModel", model, "cacheRead");

    safeUpdates[modelPathInput as any] = FieldValue.increment(usage.inputTokens);
    safeUpdates[modelPathOutput as any] = FieldValue.increment(usage.outputTokens);
    safeUpdates[modelPathCacheCreation as any] = FieldValue.increment(
      usage.cacheCreationInputTokens
    );
    safeUpdates[modelPathCacheRead as any] = FieldValue.increment(usage.cacheReadInputTokens);

    // byStage
    const stagePathInput = new FieldPath("tokenUsage", "byStage", stage, "input");
    const stagePathOutput = new FieldPath("tokenUsage", "byStage", stage, "output");
    const stagePathCacheCreation = new FieldPath(
      "tokenUsage",
      "byStage",
      stage,
      "cacheCreation"
    );
    const stagePathCacheRead = new FieldPath("tokenUsage", "byStage", stage, "cacheRead");

    safeUpdates[stagePathInput as any] = FieldValue.increment(usage.inputTokens);
    safeUpdates[stagePathOutput as any] = FieldValue.increment(usage.outputTokens);
    safeUpdates[stagePathCacheCreation as any] = FieldValue.increment(
      usage.cacheCreationInputTokens
    );
    safeUpdates[stagePathCacheRead as any] = FieldValue.increment(usage.cacheReadInputTokens);

    // updatedAt
    safeUpdates["tokenUsage.updatedAt"] = Date.now();

    await itemRef.update(safeUpdates);
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
