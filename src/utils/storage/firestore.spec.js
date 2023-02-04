import { buildFirestoreTaskDao, encodeId } from "./firestore.js";
import { TASK1, TASK2 } from "../testing/fixture.js";
import { clearFirestore } from "../testing/firestore.js";

describe("storage/firestore", () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  let taskDao;
  beforeEach(async () => {
    taskDao = buildFirestoreTaskDao();
  });

  it("should throw NotFoundError if task is not created", async () => {
    const id = encodeId({ taskIds: ["foo"] });

    await expect(taskDao.get({ id })).rejects.toThrow();
  });

  it("should create task", async () => {
    const id = await taskDao.create({ task: TASK1 });

    await expect(taskDao.get({ id })).resolves.toStrictEqual([TASK1]);
  });

  it("should create tasks", async () => {
    const id1 = await taskDao.create({ task: TASK1 });
    const id2 = await taskDao.create({ task: TASK2 });

    await expect(taskDao.get({ id: id1 })).resolves.toStrictEqual([TASK1]);
    await expect(taskDao.get({ id: id2 })).resolves.toStrictEqual([TASK2]);
  });

  it("should get multi task id", async () => {
    const id1 = await taskDao.create({ task: TASK1 });
    const id2 = await taskDao.create({ task: TASK2 });
    const multiId = await taskDao.appendIds(id1, id2);

    await expect(taskDao.get({ id: multiId })).resolves.toStrictEqual([TASK1, TASK2]);
  });

  it("should get appended task ids", async () => {
    const id1 = await taskDao.create({ task: TASK1 });
    const id2 = await taskDao.create({ task: TASK2 });
    const id = `${id1}+${id2}`;

    await expect(taskDao.get({ id })).resolves.toStrictEqual([TASK1, TASK2]);
  });

  it("should throw NotFoundError retrieved without auth", async () => {
    const auth = { uid: "1" };
    const id = await taskDao.create({ task: TASK1, auth });

    await expect(taskDao.get({ id, auth: null })).rejects.toThrow();
  });

  it("should return task if created without auth", async () => {
    const auth = { uid: "1" };
    const id = await taskDao.create({ task: TASK1, auth: null });

    await expect(taskDao.get({ id, auth })).resolves.toStrictEqual([TASK1]);
  });

  it("should return task if retrieved by same auth", async () => {
    const myAuth = { uid: "1" };
    const id = await taskDao.create({ task: TASK1, auth: myAuth });

    await expect(taskDao.get({ id, auth: myAuth })).resolves.toStrictEqual([TASK1]);
  });

  it("should throw NotFoundError retrieved by another auth", async () => {
    const myAuth = { uid: "1" };
    const otherAuth = { uid: "2" };
    const id = await taskDao.create({ task: TASK1, auth: myAuth });

    await expect(taskDao.get({ id, auth: otherAuth })).rejects.toThrow();
  });

  it("should return task if retrieved by multiple auths", async () => {
    const myAuth = { uid: "1" };
    const otherAuth = { uid: "2" };
    const id = await taskDao.create({ task: TASK1, auth: myAuth });
    await taskDao.create({ task: TASK1, auth: otherAuth });

    await expect(taskDao.get({ id, auth: myAuth })).resolves.toStrictEqual([TASK1]);
    await expect(taskDao.get({ id, auth: otherAuth })).resolves.toStrictEqual([TASK1]);
  });

  it("should throw NotFoundError if retrieved by another auth in compound id", async () => {
    const myAuth = { uid: "1" };
    const otherAuth = { uid: "2" };
    const id1 = await taskDao.create({ task: TASK1, auth: myAuth });
    const id2 = await taskDao.create({ task: TASK2, auth: otherAuth });
    const id = taskDao.appendIds(id1, id2);

    await expect(taskDao.get({ id, auth: myAuth })).rejects.toThrow();
  });
});
