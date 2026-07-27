import { getFirestore } from '../../../utils/db';
import { emitEvent, actor } from '../../../lib/funnel-events';

const handler = async (req, res) => {
  const { name } = req.query;
  try {
    const db = getFirestore();
    if (req.method === 'PUT') {
      // AuthWrapper.ensureUserExists() PUTs here only after a 404, so this is
      // the one place every sign-in method (wallet, email/Privy, SSO) converges
      // on creating a console account. The extra read costs one lookup on a path
      // that runs once per account.
      const { via, ...body } = req.body ?? {};
      const existed = (await db.collection('users').doc(name).get()).exists;
      await db.collection('users').doc(name).set({
        ...body,
        updated: new Date().toISOString(),
      }, { merge: true });
      if (!existed) {
        emitEvent('signup', {
          ...actor({ uid: String(name) }),
          via: via === 'claim' ? 'claim' : 'direct',
        });
      }
    } else if (req.method === 'GET') {
      const doc = await db.collection('users').doc(name).get();
      if (!doc.exists) {
        return res.status(404).end();
      } else {
        return res.status(200).json(doc.data());
      }
    } else if (req.method === 'DELETE') {
      await db.collection('users').doc(name).delete();
      return res.status(200).end();
    }
    res.status(200).end();
  } catch (e) {
    res.status(400).end();
  }
}

export default handler;
