# Delegated API permissions: design as built (2026-09-25)

Companion to `graffiticode_capability_policy_spec.md`. The implementation described here is on branches, tested, and **not deployed**. Delegation (grants to other users) is not built; the current scope is **owner-only**.

The spec's 2026-09-26 revisions add release prerequisites described below.
Those requirements are not implemented merely by updating these documents.

## How it works

1. A compile that selects a connection (`connectionId`) takes the **brokered path**, under an invocation the gateway allocates from policy. Without a connection, a compile never writes and never signs an Author session; it still signs previews with parse-time credentials until private artifacts replace them (see Connection-free compilation).
2. Before any code runs, the compiler scans the parsed program for protected functions. It asks policy once for a **snapshot**: which functions this user may call through this connection. An ungranted call is a compile error, and the transformer never starts.
3. When the transformer reaches a protected call, it asks policy to **mint** an execution token. The token covers exactly that call: function, broker operation, and a digest of the arguments.
4. The **broker** verifies the token, checks the registry again, and confirms the payload matches the digest. It then loads the connection's credential and performs the named operation.
   - The compiler never sees the credential.

## Components

| Piece | Where | Enforces |
|---|---|---|
| Registry | graffiticode `packages/common/src/protected-registry.js` | Which functions map to which broker operations and backend; the single authority for both policy and broker |
| Policy | graffiticode `packages/policy` | Connections, snapshot, mint, owner check; live connection check at every mint; KMS-signed tokens |
| Broker | graffiticode `packages/broker` | Token verification, registry version, per-operation payload constraints, args digest, replay protection (each token once), write receipts bound to principal, owner, connection, language, function, operation, registry version and args digest (a receipt from another registry version is refused, not replayed). Only a definite provider rejection records a write as failed; a lost response, 5xx or unrecognized body records it as uncertain |
| Compiler support | l0000 `exec-context` → published **0.5.0** | Per-compile context kept away from program variables; whole-program scan for protected calls; client for policy and broker |
| L0176 | l0176 `explicit-save`, `brokered-connection` | `save-to-itembank <activity>` is the only write; preview signing, Author signing and saves go through the broker. Author signing is enforced (brokered, non-delegable); its request shape is unverified against Learnosity |
| Gateway | graffiticode `api` | Allocates one invocation per request through a connection and passes it, with each stage, to compilers; stores private artifacts; never serves a protected task from its shared cache |
| Console | console `connections` | Server-side policy client; GraphQL connection create, list, rotate, disable and delete |

## Trust boundaries

- **The calling service** is identified by a Google ID token that policy and the broker verify themselves (`X-Caller-Identity`). That caller is bound to a role:
  - a compiler, for one language: snapshot and mint (policy), execute (broker)
  - the console: connection management (policy)
  - the gateway: invocation allocation and publications (policy)
  - policy: credential provisioning (broker)
- **The user** comes from their verified token and nothing else.
- **Tokens** are ES256 with a fixed algorithm, issuer, audience and token type:
  - invocation token (gateway, one logical invocation): 30 minutes; a retry past expiry gets a fresh one for the same invocation. A published view's token also names the publication, which confines its session to viewSafe functions
  - session token: about 15 minutes
  - execution token: at most 60 seconds, usable once, covering one request
- **Credentials:** the broker holds them, encrypted under a broker-only key and tied to their connection. Policy passes a credential through once when a connection is created or rotated, and never stores it.
- **Audit:** every allowed and denied decision is recorded with pseudonymous uids, and never with tokens, secrets or payloads.

## Removed: intents and execution modes

Removed on all branches once invocations, receipts and the read path were
built. Running the program is the action, and the grant is the authority.
- Policy has no intent route or token, and no modes. A snapshot allows the
  owner every registered function the program calls (writes and Author
  included) against the connection's backend; a publication session allows
  only `viewSafe` functions. Registry `modes` and `EXEC_MODES` are gone
  (`REGISTRY_VERSION` 4).
- l0000 has no modes, intents, disabled writes or `write-disabled` /
  `mode-disabled` sentinels (the "write not executed" marker). An ungranted
  function is a compile error before transformation; a granted one runs
  wherever the program calls it. This is a breaking API change for l0000:
  `EXEC_MODES`, `ExecMode`, `SkippedResult` and `permittedModes` are no longer
  exported.
- The gateway no longer forwards intent tokens; the console's policy client
  no longer requests them.
- Author signing runs when the owner's own program calls `author` through
  their connection. It stays non-delegable and is not `viewSafe`.
- Release: l0000 0.6.0 must be published before L0176 is consistent. On the
  published 0.5.0, 6 L0176 tests fail; against the local 0.6.0 build all 125
  pass.

## Required changes from the 2026-09-26 review

- **Reads.** Built on `policy-service`, not deployed. `GET /data` through a
  connection is a view: it serves the recipient's current artifact and never
  runs the program; `POST /compile` is the explicit run. When the head
  language signs every render (an implicit protected function in the
  registry), the gateway sends that language's compiler a fixed data-only
  program holding the stored activity, so the only operation it can reach is
  the preview signature, authorized by policy for the view. All views of one
  artifact share one invocation (idempotency key `read.<invocationId>`).
  Missing or incompatible artifacts return an error asking for a run; nothing
  is rebuilt. L0176's `brokered.test.ts` pins the program shape. Not done:
  learner-answer requests (none reach the gateway yet), the viewer and console
  sending a connection, and views of published items (4.4); reads without a
  connection still compile and sign with parse-time credentials.
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
    the save-action id.
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
- **Artifact storage and selection.** Built on `policy-service`, not deployed
  or run against Firestore. After a successful compile through a connection,
  the gateway strips the preview signature (`data.request` in the language's
  `{ data, errors }` envelope) and stores the rest as a private artifact
  (`artifacts/{invocationId}`), bound to the recipient, owner, connection,
  task chain, invocation and registry version, separate from the shared
  compile cache. A head per (recipient, task chain, connection) moves only to
  a newer invocation (compare-and-set on the policy-issued `seq`); a retry
  rewrites its own artifact. Selection returns `ok`, `missing` or
  `incompatible` (another registry version). Output that still carries a
  `signature` anywhere after stripping (an explicit `init`) is not stored. Not
  done: the Firestore store's emulator tests have not been run.
- **Recovery.** Built on `policy-service`, not deployed. The spec's
  artifact-only path and replay-only tokens are dropped: the gateway stores an
  artifact in one atomic write, so nothing is ever persisted but unpublished.
  The gateway retries a failed artifact write within the request (3 attempts).
  Otherwise recovery is retrying the original invocation with the same
  idempotency key: completed receipts return their outcome and the artifact is
  stored; an uncertain receipt blocks, and L0176's error tells the caller that
  a new key starts a new invocation whose write may run again; after
  revocation the retry is refused. End-to-end tests (gateway, policy and
  broker together, compiler stubbed) cover each case. Not done: reconciling an
  uncertain write against Learnosity's item bank.
- **Publication.** Built on `policy-service` and l0000 `exec-context`, not
  deployed. Policy holds publication records (`publications/*`), created and
  deleted only through the gateway.
  - Publishing (`POST /publications { id, connectionId }` on the gateway)
    names the caller's current artifact for that task and connection, so it
    can never be another recipient's, missing or incompatible; policy then
    requires the publisher to own the active connection (owner-only).
  - A view (`GET /data?id=&publication=`) carries no user. Policy re-checks
    the publication and connection live and returns an invocation token bound
    to the publisher and marked with the publication; a snapshot under it
    needs no user and allows only
    functions the registry marks `viewSafe` (preview signing). Every mint in
    that session re-checks the publication. All views share one invocation.
  - The gateway serves the artifact the publication names, signed through the
    read path's data-only program, with no user sent to the compiler.
  - Unpublishing or disabling the connection stops the next view and mint.
  - Registry: new `viewSafe` flag, `REGISTRY_VERSION` 3.
  - l0000: admission asks policy on an invocation token alone when there is
    no user. L0176 picks this up only with the next l0000 release.
  - Not done: the console's publish and unpublish still only flip the item's
    `isPublic`; creating and deleting publication records needs items to
    record their connection (connection selection). Delegated publishers and
    the publish permission on grants wait for delegation.
- **Connection-free compilation.** Partly done on l0176 `brokered-connection`.
  Without a connection, `save-to-itembank` never writes: it evaluates to the
  activity with `itemBank: { skipped: "no-connection", fn, occurrence }`, the
  preview still renders, and the compile passes, so generation, the corpus
  ping, eval and sweeps can never write. The Author Site is left unsigned,
  both from `author` and from an explicit `init author`. The legacy write code
  is deleted. Deliberately kept until private artifacts
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
