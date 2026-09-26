# Graffiticode delegated API permissions — design state

> **Status:** design recorded 2026-09-25. The owner-only part is implemented on
> branches and tested, but **not deployed**; delegation to other accounts is
> not built. It supersedes the earlier informal effect-scan and generic grant
> model in this document. How the build maps onto this design, and every
> branch, is in `capability-policy-as-built.md`.

## Goal and terminology

An owner of an external API connection can let another Graffiticode account
invoke specific compiler functions through that connection without disclosing
the external API key. Only compiler functions that call external APIs require
permission. Ordinary compiler functions remain unrestricted.

This is owner-managed **delegated authorization with scoped execution tokens**.
The stored grant is a relationship between identities, a connection, and a
function; the token proves authorization for a particular execution. We use
"capability" informally for the protected function, rather than claiming the
whole system is a strict object-capability model.

## Grant and management model

- A grant identifies the credential owner's UID, recipient UID, credential
  connection ID, language ID, and stable protected function name. The function
  name is the permission key. The model treats preview and write as distinct
  compiler functions; each API-calling function has its own permission key.
- The credential owner creates, lists, and revokes grants in a policy editor in
  Console Settings or an adjacent page. The owner can grant to another account
  by UID. Recipients can see connections granted to them and explicitly select
  a connection for a compile. They cannot pass a grant on to someone else.
- Grants attach to a connection, rather than to the current value of its API
  key, so rotating the key need not change the grants.
- A central policy authority owns the grant store and decisions. Auth remains
  responsible for identity; the API gateway remains responsible for task
  storage and compiler routing. The compiler cannot create or broaden grants.

## Protected compile and call

1. The recipient starts a compile with a selected connection. Auth establishes
   the recipient UID in trusted server context. The selected connection is
   caller input and must be checked against the grant; the program cannot
   supply or override the authorization context.
2. The compiler obtains the allowed protected function names for that UID,
   language, and connection once per compile. This set is a snapshot for that
   compile only; the next compile fetches policy again.
3. An admission pass checks every protected call before the transformer
   begins. An ungranted protected function is a compile error, so the
   transformer does not begin. Functions without external API calls need no
   permission check.
   - The pass scans every node of the parsed program, not the checker's walk,
     because the base checker does not visit every executable node.
   - Protected behaviour with no call in the source (e.g. L0176 signing every
     render) is declared by the language as an implicit protected function,
     required on every compile.
4. When the transformer reaches a granted protected function, the policy
   authority mints a short-lived token scoped to the recipient, connection,
   function, intended broker call, and a digest of that call's arguments. The
   admission pass supplies early rejection; the token supplies proof at the
   execution boundary.
5. A Graffiticode credential broker verifies the token against the actual
   requested operation, resolves the owner's credential, makes the external
   API call, and returns its result. The broker exposes named operations rather
   than an arbitrary HTTP proxy. The compiler and recipient do not receive the
   owner's external API key.

Running the program is the action. There is no separate save step or execution
mode: a granted protected call runs whenever its program runs, and the grant is
the authority.

The mapping from function to broker operations, backend and kind lives in one
reviewed, versioned **registry** that policy and the broker both consult. A
compiler (or a per-user language override) never defines the authority it
receives.

The broker is the security boundary that matters: a token checked only by a
compiler that already holds the owner's key would add little protection. A
managed secret store or integration provider may handle storage, rotation, or
OAuth connection management behind the broker; Graffiticode still owns the
function-specific grant and enforcement model.

## Why this design

- **Guard functions, not whole languages.** Most compiler functions are safe.
  The functions that call external APIs are known to the language implementation,
  so their names provide a direct permission vocabulary. This is clearer than
  inferring generic effects from an AST or treating every function in a service
  language as privileged.
- **Check before transformation.** Checker and transformer traverse the same AST.
  Rejecting an ungranted function in the checker prevents the transformer from
  partially evaluating the program and making earlier API calls before it
  discovers a later denial. The broker still checks at the actual call boundary
  so correctness does not depend solely on the checker.
- **Keep policy central and cache only for one compile.** The connection owner
  needs to manage and revoke grants independently of the recipient's identity
  token. One policy fetch per compile avoids repeated lookups during AST
  traversal; a new compile sees policy changes without cross-request cache
  invalidation. The current compile intentionally uses one consistent snapshot.
- **Grant a connection, then select it explicitly.** An owner can delegate use
  without sharing an API key. Binding the grant to a connection survives key
  rotation. Explicit selection avoids guessing which owner's credential to use
  when a recipient has multiple grants for the same function.
- **Use a token across the broker boundary.** A direct policy lookup would be
  sufficient inside one trusted process. A scoped token lets the independent
  broker verify that this particular function call was authorized without
  trusting the compiler's assertion. Minting it near the call limits its useful
  lifetime; the checker's earlier policy snapshot preserves early rejection.
- **Keep credentials and outbound calls in a Graffiticode broker.** A token adds
  little if the compiler can bypass it and use the owner's key directly. The
  broker holds that key and limits calls to named operations, while managed
  products may provide secret storage or OAuth lifecycle support. A generic
  authenticated HTTP proxy would expose more of the external API than a
  function-specific grant intends.

## Relationship to the current system

Today the Console can bind account credentials into an AST at parse time, and
language compilers can use those credentials during compilation. Delegated
credentials must take a different path: the owner's secret cannot be embedded
in a recipient-owned task AST. Current authentication, task authorization, and
the language-composition `composesWith` allowlist do not implement the grants
described here. No policy authority, scoped execution token, or credential
broker is shipped by this design document.

## Decided

- **Tokens.** ES256 JWTs from policy, with a fixed algorithm, issuer, audience
  and token type per profile.
  - Session token: one compile's snapshot, about 15 minutes.
  - Execution token: one broker call, at most 60 seconds. It covers one
    request (its args digest) and the broker accepts it once.
- **Revocation.** Admission uses the compile's snapshot. Every mint re-reads
  the live state, so revoking a grant, or disabling, deleting or re-owning a
  connection, stops the next protected call in a compile already running. A
  token already issued lives at most 60 seconds.
- **Audit.** Every allowed and denied decision, and every connection change, is
  recorded with pseudonymous uids. Records never carry tokens, secrets or
  payloads.
- **Credentials.** The broker holds them, encrypted under a broker-only key and
  tied to their connection. Policy passes a credential through once, when a
  connection is created or rotated, and never stores it.
- **Migrating parse-time credentials.** The migration is enforced by
  invalidating old credentials at the provider, including Graffiticode's own
  system credentials. Code changes only tidy up. New connection credentials
  never enter the parse-time ciphertext path.
- **Cached results.** The gateway never serves or stores a result for a task
  chain that requires a protected function, whether or not a connection is
  selected.
- **L0176 saves.** `save-to-itembank <activity>` is the only item-bank write.
  The older member form is rewritten to it before admission, and any other way
  of setting the flag is refused.

## Open design work

- **The L0176 read path.** L0176 opts out of the cache (`cache: false`) so the
  Learnosity tokens are refreshed on every read. As a result each view and
  learner answer re-runs the program, including saves. Options:
  - Cache the compiled result and sign on read through the broker, so the
    program runs once.
  - Keep recompiling and key write receipts to (task, call), so a re-run
    returns the recorded outcome.
- **Write receipts.** They are keyed to a save action today. Key them to the
  invocation or to the task, depending on the read-path decision.
- **A viewer without the grant.** A compile error, or a preview with the
  protected call refused.
- **Author signing.** It carries edit and delete authority. It stays
  non-delegable, and its request shape is unchecked against Learnosity's
  Author API.
- **Compiler network egress.** Compilers must be unable to reach provider hosts
  directly, so no call can bypass the broker.
- **Built but contrary to this design (to remove).** Console-issued intent
  tokens and the save/read execution modes that gate writes. They add a second
  gate outside the program.
