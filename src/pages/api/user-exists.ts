import admin from '../../utils/db';

const HEX = /^[0-9a-fA-F]+$/;

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const { address } = req.query;
  if (typeof address !== 'string' || !address) {
    return res.status(400).json({ error: 'address required' });
  }
  const raw = address.replace(/^0x/i, '');
  if (!HEX.test(raw)) {
    return res.status(400).json({ error: 'invalid address' });
  }
  const uid = raw.toLowerCase();
  try {
    await admin.auth().getUser(uid);
    return res.status(200).json({ exists: true });
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      return res.status(200).json({ exists: false });
    }
    console.error('[user-exists] lookup failed:', err);
    return res.status(500).json({ error: 'lookup failed' });
  }
};

export default handler;
