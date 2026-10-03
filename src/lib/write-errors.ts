// Plain-language reasons for a failed or skipped write through a connection
// (an item's lastWrite). The recorded message is whatever the compile, policy
// or broker said; policy refusals carry their reason code in it, e.g.
// "permission denied (system-connection)". Shared by the browser and the
// server, so it imports nothing.

export type WriteProblem = {
  // "Not saved to …", to lead the reason with.
  headline: string;
  // Why, in plain language.
  text: string;
  // Whether Retry (the same write through the same connection) can help.
  retryable: boolean;
};

// Retry writes through the CURRENT connection: it helps when there is one and
// either the problem is retryable or the current connection has changed since.
export const canRetryWrite = (
  problem: WriteProblem | null,
  write: { connectionId?: string | null } | null | undefined,
  currentConnectionId: string | null | undefined,
) => Boolean(problem && currentConnectionId && (problem.retryable || currentConnectionId !== (write?.connectionId ?? null)));

type LastWriteLike = { status?: string | null; message?: string | null } | null | undefined;

const has = (message: string, ...codes: string[]) =>
  codes.some(code => new RegExp(`(^|[^A-Za-z-])${code}([^A-Za-z-]|$)`).test(message));

export function describeWriteProblem(write: LastWriteLike): WriteProblem | null {
  if (!write || (write.status !== "failed" && write.status !== "skipped" && write.status !== "unstored")) return null;
  const message = write.message || "";
  if (write.status === "unstored") {
    // The item bank has it; Graffiticode's copy for viewing does not.
    const stored = (text: string, retryable: boolean): WriteProblem =>
      ({ headline: "Saved to the Learnosity item bank, but not stored in Graffiticode", text, retryable });
    if (has(message, "artifact-storage-unavailable")) {
      return stored("Graffiticode couldn't store the result for viewing. Retry stores it without writing to the item bank again.", true);
    }
    if (has(message, "signed-content")) {
      return stored("The result carries signed Learnosity authority, so it can't be stored. Change the program so it doesn't return a signed request.", false);
    }
    if (has(message, "content-differs", "binding-differs")) {
      return stored("This run's result differs from the one already stored for it. Recompile to run it again (the item-bank write may repeat), then republish if it is published.", false);
    }
    return stored(message || "unknown reason", false);
  }
  if (write.status === "skipped" || message === "no-connection") {
    return { headline: "Not saved to the item bank", text: "no Learnosity connection. Add one in Settings.", retryable: false };
  }
  const failed = (text: string, retryable: boolean): WriteProblem =>
    ({ headline: "Not saved to the Learnosity item bank", text, retryable });
  if (has(message, "system-connection")) {
    return failed("This is Graffiticode's preview account; it can't write to an item bank. Add your own Learnosity connection in Settings.", false);
  }
  if (has(message, "not-granted", "fn-not-in-session")) {
    // The owner's own settings for the connection refuse it the same way a
    // narrower share does.
    return failed("This connection's access doesn't include saving to the item bank for this language. If it's your connection, change your access under Settings → Connections; if it was shared with you, ask its owner.", false);
  }
  if (has(message, "connection-disabled")) {
    return failed("This connection is disabled.", false);
  }
  if (has(message, "connection-not-found", "not-owner")) {
    return failed("This connection is no longer available to you.", false);
  }
  if (has(message, "uncertain")) {
    // Retrying reuses the save's idempotency key, which only returns the same
    // uncertain outcome; Recompile writes again under a new one.
    return failed("The save is uncertain — it may or may not have been written. Check the item bank; to save again anyway, recompile the item (the write may repeat).", false);
  }
  return failed(message || "unknown error", true);
}
