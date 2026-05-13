// Phase 1 stub. Phase 2 wires this to the auth-service /linked-emails/lookup
// endpoint plus Privy server-side access-token verification, then mints a
// Firebase custom token for matched emails. Until then we always return
// "no match" so the email sign-in flow falls through to the confirm dialog.

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  return res.status(200).json({ matched: false });
};

export default handler;
