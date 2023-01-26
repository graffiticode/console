import { request, gql } from 'graphql-request';

export const postTask = async ({ uid, lang, code }) => {
  const query = gql `
    mutation post ($uid: String!, $lang: String!, $code: String!, $ephemeral: Boolean!) {
      postTask(uid: $uid, lang: $lang, code: $code, ephemeral: $ephemeral)
    }
  `;
  const ephemeral = true;
  return request('/api', query, {uid, lang, code, ephemeral}).then(data => data.postTask);
};

export const buildSaveTask = ({ setNewTask }) => async ({ uid, lang, code, mark }) => {
  try {
  const query = gql `
    mutation post ($uid: String!, $lang: String!, $code: String!, $mark: Int!) {
      saveTask(uid: $uid, lang: $lang, code: $code, mark: $mark)
    }
  `;
    const task = await request('/api', query, {uid, lang, code, mark}).then(data => JSON.parse(data.saveTask));
    setNewTask(task);
  } catch (x) {
    console.log("buildSaveTask() catch " + x.stack);
  }
};

export const loadTasks = async ({ uid, lang, mark }) => {
  if (!uid) {
    return {};
  }
  const query = gql `
    query get($uid: String!, $lang: String!, $mark: Int!) {
      getTasks(uid: $uid, lang: $lang, mark: $mark)
    }
  `;
  return request('/api', query, { uid, lang, mark }).then(data => JSON.parse(data.getTasks));
};

