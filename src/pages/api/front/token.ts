import { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import { getFirestore } from '../../../utils/db';

const authUrl = process.env.NEXT_PUBLIC_GC_AUTH_URL || "https://auth.graffiticode.org";

// Allowed origins for CORS
const allowedOrigins = [
  'https://app.frontapp.com',
  'http://localhost:5173',
  'http://localhost:5174',
];

interface FrontEmailEntry {
  userId: string;
  apiKeyId: string;
}

interface ApiKeyPrivate {
  token: string;
}

function hashEmailAuth(authSecret: string, email: string): string {
  return createHash('sha256').update(authSecret + email).digest('hex');
}

function setCorsHeaders(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(req, res);

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { auth_secret, email } = req.body;

  if (!auth_secret || typeof auth_secret !== 'string') {
    return res.status(400).json({ error: 'auth_secret is required' });
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email is required' });
  }

  const db = getFirestore();

  try {
    // Compute hash from auth_secret + email
    const hash = hashEmailAuth(auth_secret, email.toLowerCase());

    // Look up the integrations/front/emails entry
    const frontEmailDoc = await db.collection('integrations').doc('front').collection('emails').doc(hash).get();

    if (!frontEmailDoc.exists) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const frontEmailData = frontEmailDoc.data() as FrontEmailEntry;
    const { apiKeyId } = frontEmailData;

    // Get the API key token from api-keys-private
    const apiKeyPrivateDoc = await db.collection('api-keys-private').doc(apiKeyId).get();

    if (!apiKeyPrivateDoc.exists) {
      console.error('API key private document not found:', apiKeyId);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const apiKeyPrivate = apiKeyPrivateDoc.data() as ApiKeyPrivate;
    const { token: apiKeyToken } = apiKeyPrivate;

    // Exchange the API key token for a JWT via the auth service
    const authResponse = await fetch(`${authUrl}/authenticate/api-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: apiKeyToken }),
    });

    if (!authResponse.ok) {
      console.error('Auth service error:', authResponse.status, await authResponse.text());
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authData = await authResponse.json();

    return res.status(200).json({
      access_token: authData.access_token,
    });
  } catch (error) {
    console.error('Error in front/token:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
