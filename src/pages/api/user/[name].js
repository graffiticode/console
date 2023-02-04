import { getFirestore } from '../../../utils/db';

const handler = async (req, res) => {
  const { name } = req.query;
  console.log("GET /user name=" + name);
  try {
    const db = getFirestore();
    if (req.method === 'PUT') {
      await db.collection('users').doc(name).update({
        ...req.body,
        updated: new Date().toISOString(),
      });
    } else if (req.method === 'GET') {
      const doc = await db.collection('users').doc(name).get();
      console.log("GET /user doc=" + JSON.stringify(doc, null, 2));
      console.log("GET /user doc.exists=" + JSON.stringify(doc.exists, null, 2));
      console.log("GET /user doc.data()=" + JSON.stringify(doc.data(), null, 2));
      if (!doc.exists) {
        res.status(404).end();
      } else {
        res.status(200).json(doc.data());
      }
    } else if (req.method === 'DELETE') {
      await db.collection('users').doc(name).delete();
    }
    res.status(200).end();
  } catch (e) {
    res.status(400).end();
  }
}

export default handler;
