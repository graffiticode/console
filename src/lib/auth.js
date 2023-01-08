import ethUtil from "@ethereumjs/util";

const AUTH_URL = "http://localhost:4100";

const registerUser = async ({ address }) => {
  const res = await fetch(`${AUTH_URL}/users/register`, {
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
  const res = await fetch(`${AUTH_URL}/users/${address}`);
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
  const res = await fetch(`${AUTH_URL}/exchange/ethereum/${address}`, {
    method: "POST",
    body: JSON.stringify({ signature }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const body = await res.json();
  console.log(body);
  if (!res.ok) {
    const err = new Error(`failed to authenticate with ethereum: ${res.status} ${res.statusText}`);
    err.body = body;
    throw err;
  }
};

export const getUserNonce = async ({ address }) => {
  await registerUser({ address });
  const userData = await getUser({ address });
  return userData.nonce;
};

export const createMessageHash = ({ nonce }) => {
  const msg = `Nonce: ${nonce}`;
  const msgBuffer = Buffer.from(msg, "ascii");
  return ethUtil.hashPersonalMessage(msgBuffer);
};
