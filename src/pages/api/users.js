import { getFirestore } from '../../utils/db';

const handler = async (req, res) => {
  try {
    console.log("GET /users");
    const db = getFirestore();
    const users = await db.collection('users').orderBy('created').get();
    const usersData = users.docs.map(entry => ({
      id: entry.id,
      ...entry.data()
    }));
    res.status(200).json({ usersData });
  } catch (e) {
    res.status(400).end();
  }
}

export default handler;
