import { PrivyClient } from '@privy-io/server-auth';
import admin from '../../../utils/db';

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_GC_AUTH_URL || 'https://auth.graffiticode.org';
const AUTH_SERVICE_INTERNAL_API_KEY = process.env.AUTH_SERVICE_INTERNAL_API_KEY || process.env.INTERNAL_API_KEY || '';
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || '';

let privyClient: PrivyClient | null = null;
const getPrivyClient = () => {
  if (privyClient) return privyClient;
  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
    throw new Error('Privy server credentials not configured');
  }
  privyClient = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);
  return privyClient;
};

const extractEmail = (user: any): string | null => {
  if (typeof user?.email?.address === 'string') return user.email.address;
  if (typeof user?.email === 'string') return user.email;
  const linked = Array.isArray(user?.linkedAccounts) ? user.linkedAccounts : [];
  const emailAccount = linked.find((a: any) => a?.type === 'email' && typeof a.address === 'string');
  return emailAccount?.address ?? null;
};

async function lookupLinkedEmail(email: string): Promise<string | null> {
  if (!AUTH_SERVICE_INTERNAL_API_KEY) {
    console.warn('[email-signin/resolve] auth-service internal key not configured; returning no match');
    return null;
  }
  const url = `${AUTH_SERVICE_URL.replace(/\/$/, '')}/linked-emails/internal/lookup?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'X-Internal-API-Key': AUTH_SERVICE_INTERNAL_API_KEY },
  });
  if (!res.ok) {
    console.warn('[email-signin/resolve] auth-service lookup failed', res.status);
    return null;
  }
  const body = await res.json();
  if (body?.status !== 'success') return null;
  if (!body.data?.matched) return null;
  return body.data.uid ?? null;
}

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const { privyIdentityToken } = req.body || {};
  if (typeof privyIdentityToken !== 'string' || !privyIdentityToken) {
    return res.status(400).json({ matched: false, error: 'privyIdentityToken required' });
  }

  let email: string | null = null;
  try {
    const user = await getPrivyClient().getUser({ idToken: privyIdentityToken });
    email = extractEmail(user);
  } catch (err: any) {
    console.warn('[email-signin/resolve] Privy token verification failed:', err?.message);
    return res.status(200).json({ matched: false });
  }
  if (!email) {
    return res.status(200).json({ matched: false });
  }
  const normalizedEmail = email.trim().toLowerCase();

  let uid: string | null = null;
  try {
    uid = await lookupLinkedEmail(normalizedEmail);
  } catch (err: any) {
    console.error('[email-signin/resolve] lookup error:', err?.message);
    return res.status(200).json({ matched: false, email: normalizedEmail });
  }
  if (!uid) {
    return res.status(200).json({ matched: false, email: normalizedEmail });
  }

  try {
    const customToken = await admin.auth().createCustomToken(uid);
    return res.status(200).json({ matched: true, customToken });
  } catch (err: any) {
    console.error('[email-signin/resolve] custom token mint failed:', err?.message);
    return res.status(500).json({ matched: false, error: 'failed to mint custom token' });
  }
};

export default handler;
