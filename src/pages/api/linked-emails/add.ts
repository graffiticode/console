import { PrivyClient } from '@privy-io/server-auth';
import { client } from '../../../lib/auth';

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_GC_AUTH_URL || 'https://auth.graffiticode.org';
const INTERNAL_API_KEY = process.env.AUTH_SERVICE_INTERNAL_API_KEY || process.env.INTERNAL_API_KEY || '';
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

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  let uid: string;
  try {
    const verified = await client.verifyToken(token);
    uid = verified.uid;
  } catch {
    return res.status(401).json({ error: { message: 'Invalid auth token' } });
  }

  const { privyIdentityToken } = req.body || {};
  if (typeof privyIdentityToken !== 'string' || !privyIdentityToken) {
    return res.status(400).json({ error: { message: 'privyIdentityToken required' } });
  }

  let email: string | null = null;
  try {
    const privyUser = await getPrivyClient().getUser({ idToken: privyIdentityToken });
    email = extractEmail(privyUser);
  } catch (err: any) {
    return res.status(400).json({
      error: { message: 'Could not verify email ownership', detail: err?.message },
    });
  }
  if (!email) {
    return res.status(400).json({ error: { message: 'No email on Privy identity' } });
  }

  if (!INTERNAL_API_KEY) {
    return res.status(500).json({ error: { message: 'Internal API key not configured' } });
  }

  const upstream = await fetch(`${AUTH_SERVICE_URL.replace(/\/$/, '')}/linked-emails/internal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-API-Key': INTERNAL_API_KEY,
    },
    body: JSON.stringify({ uid, email }),
  });
  const upstreamBody = await upstream.json().catch(() => ({}));

  if (upstream.status === 409) {
    return res.status(409).json({
      error: {
        message: upstreamBody?.error?.message || 'Email already linked to another account',
        details: upstreamBody?.error?.details || {},
      },
    });
  }
  if (!upstream.ok) {
    return res.status(upstream.status).json({
      error: { message: upstreamBody?.error?.message || 'Failed to add email' },
    });
  }
  return res.status(200).json({
    status: 'success',
    data: { email: upstreamBody?.data?.email || email, id: upstreamBody?.data?.id },
  });
};

export default handler;
