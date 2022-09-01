import db from '../../../utils/db';

export default async (req, res) => {
  try {
    const { email } = req.body;
    const users = await db.collection('users').get();
    let id;
    users.docs.map((user) => {
      const data = user.data();
      if (data.email === email) {
        id = user.id;
      }
    });
    if (id !== undefined) {
      // Already have this user, so return it.
      console.info("*POST /user id=" + id);
      res.status(200).json({ id });
    } else {
      // Otherwise, make a new one.
      const { id } = await db.collection('users').add({
        ...req.body,
        created: new Date().toISOString(),
      });
      console.info("POST /user id=" + id);
      res.status(200).json({ id });
    }
  } catch (e) {
    console.info("POST /user error=" + e);
    res.status(400).end();
  }
}
