import { request, gql } from 'graphql-request';

export const postTask = async ({ user, lang, code }) => {
  const query = gql`
    mutation post ($token: String!, $lang: String!, $code: String!, $ephemeral: Boolean!) {
      postTask(token: $token, lang: $lang, code: $code, ephemeral: $ephemeral)
    }
  `;
  const token = await user.getToken();
  const ephemeral = true;
  return request('/api', query, { token, lang, code, ephemeral }).then(data => data.postTask);
};

export const buildSaveTask = ({ setNewTask }) => async ({ user, lang, code, mark, isPublic }) => {
  try {
    const query = gql`
    mutation post ($token: String!, $lang: String!, $code: String!, $mark: Int!, $isPublic: Boolean) {
      saveTask(token: $token, lang: $lang, code: $code, mark: $mark, isPublic: $isPublic)
    }
  `;
    const token = await user.getToken();
    const task = await request('/api', query, { token, lang, code, mark, isPublic }).then(data => JSON.parse(data.saveTask));
    setNewTask(task);
  } catch (x) {
    console.log("buildSaveTask() catch " + x.stack);
  }
};

export const loadTasks = async ({ user, lang, mark }) => {
  if (!user) {
    return {};
  }
  const token = await user.getToken();
  const query = gql`
    query get($token: String!, $lang: String!, $mark: Int!) {
      getTasks(token: $token, lang: $lang, mark: $mark)
    }
  `;
  return request('/api', query, { token, lang, mark }).then(data => JSON.parse(data.getTasks));
};

