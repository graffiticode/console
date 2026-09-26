# Delegated API permissions: design as built (2026-09-25)

Companion to `graffiticode_capability_policy_spec.md`. The implementation described here is on branches, tested, and **not deployed**. Delegation (grants to other users) is not built; the current scope is **owner-only**.

The spec's 2026-09-26 revisions add release prerequisites described below.
Those requirements are not implemented merely by updating these documents.

## How it works

1. A compile that selects a connection (`connectionId`) takes the **brokered path**. Without a connection, the legacy path runs unchanged; the spec replaces it with connection-free compilation (see Required changes).
2. Before any code runs, the compiler scans the parsed program for protected functions. It asks policy once for a **snapshot**: which functions this user may call through this connection. An ungranted call is a compile error, and the transformer never starts.
3. When the transformer reaches a protected call, it asks policy to **mint** an execution token. The token covers exactly that call: function, broker operation, and a digest of the arguments.
4. The **broker** verifies the token, checks the registry again, and confirms the payload matches the digest. It then loads the connection's credential and performs the named operation.
   - The compiler never sees the credential.

## Components

| Piece | Where | Enforces |
|---|---|---|
| Registry | graffiticode `packages/common/src/protected-registry.js` | Which functions map to which broker operations and backend; the single authority for both policy and broker |
| Policy | graffiticode `packages/policy` | Connections, snapshot, mint, owner check; live connection check at every mint; KMS-signed tokens |
| Broker | graffiticode `packages/broker` | Token verification, registry version, per-operation payload constraints, args digest, replay protection (each token once), write receipts. Only a definite provider rejection records a write as failed; a lost response, 5xx or unrecognized body records it as uncertain |
| Compiler support | l0000 `exec-context` → published **0.5.0** | Per-compile context kept away from program variables; whole-program scan for protected calls; client for policy and broker |
| L0176 | l0176 `explicit-save`, `brokered-connection` | `save-to-itembank <activity>` is the only write; preview signing, Author signing and saves go through the broker. Author signing is enforced (brokered, non-delegable); its request shape is unverified against Learnosity |
| Gateway | graffiticode `api` | Passes `connectionId` to compilers; never serves a protected task from its cache |
| Console | console `connections` | Server-side policy client; GraphQL connection create, list, rotate, disable and delete |

## Trust boundaries

- **The calling service** is identified by a Google ID token that policy and the broker verify themselves (`X-Caller-Identity`). That caller is bound to a role:
  - a compiler, for one language
  - the console
  - policy
- **The user** comes from their verified token and nothing else.
- **Tokens** are ES256 with a fixed algorithm, issuer, audience and token type:
  - session token: about 15 minutes
  - execution token: at most 60 seconds, usable once, covering one request
- **Credentials:** the broker holds them, encrypted under a broker-only key and tied to their connection. Policy passes a credential through once when a connection is created or rotated, and never stores it.
- **Audit:** every allowed and denied decision is recorded with pseudonymous uids, and never with tokens, secrets or payloads.

## Conflicts with your model (to remove)

- **Intent tokens and mode gating.** A write runs only in `save` mode, which comes only from a console-issued intent. That puts a second gate outside the program. Under your model, running the program is the action and the grant is the authority.
  - Affected commits: policy `362f5ec` and `144c421`, the l0000 client `008c4dd`, the api's intent forwarding `8122f08`, and the L0176 brokered path.
  - Removing it means an l0000 0.6.0 release.
  - Do not remove it until invocation-based receipts and private artifact reads
    satisfy the spec's release prerequisites.
- **The "write not executed" marker.** It hides the preview when a program containing a save is viewed. It goes away with the mode gating.

## Required changes from the 2026-09-26 review

- **Reads.** The chosen design retains unsigned content in a private execution
  artifact and authorizes preview signing afresh on every view. Views and
  learner answers do not rerun saves. This storage is separate from the shared
  compile cache, which remains prohibited for protected task chains. Missing
  or incompatible artifacts must not trigger an automatic write-bearing run.
- **Invocation identity.** Done on branches, not deployed.
  - Policy (`policy-service`) allocates invocations on a new gateway-only
    route, `POST /v1/invocations`, and returns a signed invocation token. An
    idempotency key, scoped to the user and bound to the task chain,
    connection and input digest, returns the same invocation; a reused key
    with different input is refused. Each invocation carries a sequence that
    increases per user, task chain and connection, ready for artifact
    ordering.
  - The gateway (`api`) allocates one invocation per request through a
    connection (key from `Idempotency-Key` or `body.idempotencyKey`) and
    names each chain stage by position (`s0`, `s1`, ...).
  - l0000 (`exec-context`) and L0176 carry the invocation token and stage to
    the snapshot. Policy accepts only its own invocation token for the same
    user and connection.
  - Operation ids are `invocation/stage/occurrence` for every call, replacing
    the save-action id. Intents still gate writes until their removal.
  - Not done: receipt retention and TTLs; clients sending idempotency keys
    (none sends a connection yet); an l0000 release carrying this
    (L0176 still depends on 0.5.0); the gateway's `POLICY_URL`, its
    `run.invoker` on policy and its `gateway` entry in `policy-callers`. Not
    run: the Firestore invocation store and the gateway's data tests (both
    need the emulator).
- **Connection ownership.** Done on `policy-service`. The broker stores each
  credential with its owner and backend, sealed into the ciphertext's
  associated data, and refuses a token whose owner or backend differs
  (`credential-binding-mismatch`). Creating a secret and rotating it are
  separate routes: rotation must keep the owner, backend and key (the
  Learnosity consumer key identifies the provider account), and policy
  reports a refusal as `provider-account-changed`. Deleting leaves a tombstone,
  so an id is never reused. The Firestore store's emulator test has not been
  run.
- **Registry versions.** Done on `policy-service`: policy checks the version
  at minting, and the broker refuses a token whose version is not the one it
  has installed, before touching the credential. Keeping an older reviewed
  version during a rolling deploy is not supported yet; a mismatch is refused.
- **Artifact storage and selection.** Done on `policy-service`, not deployed.
  After a successful compile through a connection, the gateway stores the
  output minus its `request` signature as a private artifact
  (`artifacts/{invocationId}`), bound to the recipient, owner, connection,
  task chain, invocation and registry version, separate from the shared
  compile cache. A head per (recipient, task chain, connection) moves only to
  a newer invocation (compare-and-set on the policy-issued `seq`); a retry
  rewrites its own artifact. Selection returns `ok`, `missing` or
  `incompatible` (another registry version). Not done: no route reads
  artifacts yet (4.2); a failed artifact write is only logged (recovery,
  4.3). The Firestore store's emulator tests have not been run.
- **Recovery.** Not built. Two paths, neither allocating a new invocation:
  - Artifact-only: a separate entry point, authenticated as the original
    recipient and invocation, publishes persisted unsigned content using
    replay-only tokens for completed receipts. It never contacts the provider
    and cannot complete an unfinished call. Needs the unsigned content
    persisted before artifact publication.
  - Retry: a compile under the original invocation ID and current
    authorization. Completed receipts return their outcome; pending or
    uncertain ones block until reconciled.
- **Publication.** Not built. Creating one requires that the publisher is the
  artifact's recipient, may publish the task, matches the artifact's connection
  and revision, and holds the preview grant (under delegation, one that permits
  publication). Views run under the publication and re-check it live,
  including publication permission, and may use only view-safe functions,
  which needs a new registry flag.
- **Connection-free compilation.** Partly done on l0176 `brokered-connection`.
  Without a connection, `save-to-itembank` never writes: it evaluates to the
  activity with `itemBank: { skipped: "no-connection", fn, occurrence }`, the
  preview still renders, and the compile passes, so generation, the corpus
  ping, eval and sweeps can never write. The Author Site is left unsigned. The
  legacy write code is deleted. Deliberately kept until private artifacts
  replace it: preview signing with parse-time credentials. Not done: a
  language-independent skip list in l0000 (the skip is L0176's own field).
- **Compiler egress control.** Not built or verified. Compilers must be unable
  to reach provider hosts directly; this is a deployment prerequisite.

## Open decisions

1. **Author signing.** It carries edit and delete authority. Enforcement is built: it goes through the broker and is non-delegable. Unverified: its request shape against Learnosity's Author API, so it is not yet usable.
2. **Delegation.** Grant records and the UI are not built. It stays behind a flag that is off.

## Not done or unverified

- Nothing is deployed. The IAM review is committed, but it has no live data, because `gcloud` needs an interactive login.
- The build configs need three secrets the IAM review doesn't list: `policy-callers`, `broker-callers` and `audit-pseudonym-secret`.
- Still to run:
  - the spec's acceptance checks (retry, read path, artifact selection,
    recovery, publication, connection-free compilation, credential binding,
    registry version, egress) once the required changes above are implemented
  - one real owner save end to end
  - publishing a composed item end to end
  - the L0176 corpus ping against a deployed revision
- The `authenticate.spec` failure predates this work; it also fails on `main`.

## Branches

- **graffiticode:**
  - `auth-certs-internal`: the `/certs` fix; ship independently
  - `task-acl-repost`: task ACL changes; deploy the console change first
  - `capability-iam-review`: the IAM review document
  - `protected-registry` → `policy-service`: registry, cache bypass, policy, broker, configs
- **l0000:** `exec-context`, published as 0.5.0 from this branch; merge before the next publish from `main`
- **l0176:** `explicit-save` → `brokered-connection`
- **console:**
  - `publish-public-task-id`: points a published item at its public task id
  - `connections`
