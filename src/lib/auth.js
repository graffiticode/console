import { createRemoteJWKSet, jwtVerify } from "jose";

const authUrl = process.env.NEXT_PUBLIC_GC_AUTH_URL || "https://auth.graffiticode.org";
const JWKS = createRemoteJWKSet(new URL(`${authUrl}/certs`));

export const getEthereumNonce = async ({ address }) => {
  const res = await fetch(`${authUrl}/authenticate/ethereum/${address}`);
  const body = await res.json();
  if (!res.ok) {
    const err = new Error(`failed to get user: ${res.status} ${res.statusText}`);
    err.body = body;
    throw err;
  }
  const { data: nonce } = body;
  return nonce;
};

export const authenticateWithEthereum = async ({ address, nonce, signature }) => {
  const res = await fetch(`${authUrl}/authenticate/ethereum/${address}`, {
    method: "POST",
    body: JSON.stringify({ nonce, signature }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const body = await res.json();
  if (!res.ok) {
    const err = new Error(`failed to authenticate with ethereum: ${res.status} ${res.statusText}`);
    err.body = body;
    throw err;
  }
  const { data: { accessToken, refreshToken } } = body;
  return { accessToken, refreshToken };
};

export const exchangeRefreshToken = async ({ refreshToken }) => {
  const res = await fetch(`${authUrl}/authenticate/refreshToken`, {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const body = await res.json();
  if (!res.ok) {
    const err = new Error(`failed to exchange refreshToken: ${res.status} ${res.statusText}`);
    err.body = body;
    throw err;
  }
  const { data: { accessToken } } = body;
  return accessToken;
};

export const verifyAccessToken = async ({ accessToken }) => {
  const { payload } = await jwtVerify(accessToken, JWKS, { issuer: "urn:graffiticode:auth" });
  return payload;
};
