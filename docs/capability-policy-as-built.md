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
| Broker | graffiticode `packages/broker` | Token verification, per-operation payload constraints, args digest, replay protection (each token once), write receipts |
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
- **Write receipts.** Replace the current save-action identity with a durable
  logical invocation and stable call occurrence. Retries reuse that identity;
  intentional reruns get a new one. Specify receipt bindings, retention,
  partial outcomes and uncertainty handling as required by the spec before
  removing intent tokens.
- **Connection ownership.** Ownership and backend are immutable; transfers and
  provider-account changes require a new connection ID and grants. Deleted
  IDs cannot be reused. The broker currently loads a credential by connection
  ID alone; it must also enforce the token's owner and backend binding.
- **Registry versions.** Tokens carry a registry version and policy checks it
  during minting, but the broker currently checks operations against its local
  registry without enforcing the token's version. It must execute under the
  exact reviewed version or refuse before contacting the provider.
- **Artifact selection.** Not built. Views select by recipient, task-chain
  revision and connection, and "latest" is invocation order with
  compare-and-set, so an older run cannot replace a newer artifact.
- **Recovery.** Not built. A separate entry point, authenticated as the
  original recipient and invocation, publishes persisted unsigned content using
  replay-only tokens for completed receipts. It never contacts the provider and
  cannot complete an unfinished call. Needs the unsigned content persisted
  before artifact publication.
- **Publication.** Not built. Creating one requires that the publisher is the
  artifact's recipient, may publish the task, matches the artifact's connection
  and revision, and holds the preview grant (under delegation, one that permits
  publication). Views run under the publication, re-check it live, and may use
  only view-safe functions, which needs a new registry flag.
- **Connection-free compilation.** Not built; the legacy path still uses
  parse-time credentials. It must never contact policy or the broker, list
  skipped protected calls separately from errors, and pass verification when a
  skipped call is the only issue. Generation, the corpus ping, eval and sweeps
  use it.
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
