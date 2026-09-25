# Graffiticode delegated API permissions — design state

> **Status:** proposed design, recorded 2026-09-25. This is not implemented. It
> supersedes the earlier informal effect-scan and generic grant model in this
> document. Decisions below capture the discussion; the open questions are not
> implementation requirements yet.

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
3. The checker traverses the AST. An ungranted protected function is a compile
   error, so the transformer does not begin. Functions without external API
   calls need no permission check.
4. When the transformer reaches a granted protected function, the policy
   authority mints a short-lived token scoped to the recipient, connection,
   function, and intended broker call. The checker supplies early rejection;
   the token supplies proof at the execution boundary.
5. A Graffiticode credential broker verifies the token against the actual
   requested operation, resolves the owner's credential, makes the external
   API call, and returns its result. The broker exposes named operations rather
   than an arbitrary HTTP proxy. The compiler and recipient do not receive the
   owner's external API key.

The broker is the security boundary that matters: a token checked only by a
compiler that already holds the owner's key would add little protection. A
managed secret store or integration provider may handle storage, rotation, or
OAuth connection management behind the broker; Graffiticode still owns the
function-specific grant and enforcement model.

## Relationship to the current system

Today the Console can bind account credentials into an AST at parse time, and
language compilers can use those credentials during compilation. Delegated
credentials must take a different path: the owner's secret cannot be embedded
in a recipient-owned task AST. Current authentication, task authorization, and
the language-composition `composesWith` allowlist do not implement the grants
described here. No policy authority, scoped execution token, or credential
broker is shipped by this design document.

## Open design work

- Define token format, lifetime, audience, replay handling, and what revocation
  means for a token already issued or a compile already running.
- Define grant-change and external-call audit records without logging secrets,
  tokens, or sensitive request data.
- Specify how existing parse-time credentials move to connections held behind
  the broker, and how compiler network access is constrained so calls cannot
  bypass it.
- Specify behavior for cached compiled results and public task reads when
  output came from an owner's protected connection.
