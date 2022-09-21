//import { doc, getDoc } from "firebase/firestore";
import db from '../../utils/db';

const handler = async (req, res) => {
  const { id } = req.query;
  console.log("GET /secret id=" + id);
  const client = await db.doc(`users/${id}`).get();
  console.log("GET /secret client=" + JSON.stringify(client, null, 2));
  const clientData = client.data();
  console.log("Document data:", clientData);
  res.json({ client_secret: clientData.stripeClientSecret });
};

export default handler;
