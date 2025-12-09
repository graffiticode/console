import { getFirestore } from '../../../utils/db';

const handler = async (req, res) => {
  const { name } = req.query;
  try {
    const db = getFirestore();
    if (req.method === 'PUT') {
      await db.collection('users').doc(name).set({
        ...req.body,
        updated: new Date().toISOString(),
      }, { merge: true });
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
