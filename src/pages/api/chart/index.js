import { postTask } from "./resolvers.js";

const handler = async (req, res) => {
  try {
    const items = req.body;
    items.map(item => {
      const {type, data} = items;
      const chartId = getIdFromType(type);
      const dataId = postTask(auth, {lang: "1", code: `${data}..`});
      const itemId = [chartId, dataId].join("+");

      const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
      const taskDao = getTaskDaoForStore("firestore");
      const auth = { uid };
      
      const userRef = await db.doc(`users/${uid}`);

      const itemIdsCol = userRef.collection("itemIds");
      await itemIdsCol.doc(itemId).set({
        created,
        url,
        isScraped
      });
    });
  } catch (e) {
    console.info("POST /user error=" + e);
    res.status(400).end();
  }
}

export default handler;
