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

export const saveTask = async ({ uid, lang, code, mark }) => {
  const query = gql `
    mutation post ($uid: String!, $lang: String!, $code: String!, $mark: Int!) {
      saveTask(uid: $uid, lang: $lang, code: $code, mark: $mark)
    }
  `;
  return request('/api', query, {uid, lang, code, mark}).then(data => data);
};

export const loadTasks = async ({ uid, lang, mark }) => {
  console.log("loadTasks() uid=" + uid);
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

