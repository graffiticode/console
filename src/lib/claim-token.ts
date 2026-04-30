import { jwtVerify } from "jose";

/**
 * Claim-token contract — shared with the MCP server, which mints these tokens.
 *
 * - Algorithm: HS256
 * - Secret: FREE_PLAN_NAMESPACE_SALT (UTF-8 bytes)
 * - Audience: "graffiticode-claim"
 * - Expiry: 24h from issuance
 * - Payload claims:
 *     sessionNamespace: string  // sha256(salt + ":" + sessionUuid), already derived
 *     sessionUuid:      string  // raw MCP trial session uuid (provenance only)
 *
 * The minter (MCP repo) MUST mirror exactly this shape and signing parameters.
 */

export type ClaimTokenPayload = {
  sessionNamespace: string;
  sessionUuid: string;
};

const AUDIENCE = "graffiticode-claim";

function getSecret(): Uint8Array {
  const salt = process.env.FREE_PLAN_NAMESPACE_SALT;
  if (!salt) {
    throw new Error("FREE_PLAN_NAMESPACE_SALT is not configured");
  }
  return new TextEncoder().encode(salt);
}

export async function verifyClaimToken(token: string): Promise<ClaimTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    audience: AUDIENCE,
    algorithms: ["HS256"],
  });
  const sessionNamespace = payload.sessionNamespace;
  const sessionUuid = payload.sessionUuid;
  if (typeof sessionNamespace !== "string" || !sessionNamespace) {
    throw new Error("Claim token missing sessionNamespace");
  }
  if (typeof sessionUuid !== "string" || !sessionUuid) {
    throw new Error("Claim token missing sessionUuid");
  }
  return { sessionNamespace, sessionUuid };
}
