import { getIdToken, signInWithCustomToken } from "firebase/auth";
import { apiAuth as auth } from "./firebase";

const authUrl = process.env.NEXT_PUBLIC_GC_AUTH_URL || "https://auth.graffiticode.org";

const registerUser = async ({ address }) => {
  const res = await fetch(`${authUrl}/users/register`, {
    method: "POST",
    body: JSON.stringify({ uid: address }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const body = await res.json();
  if (!res.ok) {
    const { error: { code } } = body;
    if (code !== 4001) {
      const err = new Error(`failed to register user: ${res.status} ${res.statusText}`);
      err.body = body;
      throw err;
    }
  }
};

const getUser = async ({ address }) => {
  const res = await fetch(`${authUrl}/users/${address}`);
  const body = await res.json();
  if (!res.ok) {
    const err = new Error(`failed to get user: ${res.status} ${res.statusText}`);
    err.body = body;
    throw err;
  }
  const { data: userData } = body;
  return userData;
};

export const exchangeEthereum = async ({ address, signature }) => {
  const res = await fetch(`${authUrl}/exchange/ethereum/${address}`, {
    method: "POST",
    body: JSON.stringify({ signature }),
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
  const { data: { token: customToken } } = body;
  // const { user } = await signInWithCustomToken(auth, customToken);
  // const token = await getIdToken(user);
  // return token;
  return customToken;
};

export const getUserNonce = async ({ address }) => {
  await registerUser({ address });
  const userData = await getUser({ address });
  return userData.nonce;
};
