import "./eval-env";
import { getFirestore } from "../src/utils/db";
const UID = "24493e1c7a7f1ad57e3c478087c74c2dacb0cba1";
const KEEP: Record<string,string> = { "GVCtnwQ59GEZZO2QDvVp":"004", "mwWYGNIlTbZggAeBbxc5":"017", "FpZVn0cGgWTxPjlaXSFo":"035" };
(async () => {
  const db = getFirestore();
  const snap = await db.collection(`users/${UID}/items`).where("lang","==","0178").get();
  let kept=0, parked=0;
  for (const d of snap.docs) {
    const x: any = d.data();
    if (KEEP[d.id]) { await d.ref.update({ name: KEEP[d.id] }); kept++; continue; }
    await d.ref.update({ name: `${x.name}-prevocab`, mark: 1 });
    parked++;
  }
  console.log(`kept+renamed ${kept} good baseline items; parked ${parked} pre-vocab-fix attempts`);
  const after = await db.collection(`users/${UID}/items`).where("lang","==","0178").get();
  console.log("names now:", after.docs.map(d => (d.data() as any).name).sort().join(" "));
  process.exit(0);
})();
