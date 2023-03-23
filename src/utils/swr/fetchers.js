import bent from "bent";
import { GraphQLClient, gql } from 'graphql-request';

const buildRequestClient = async ({ token }) => {
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  return client;
};

export const postTask = async ({ user, lang, code }) => {
  const query = gql`
    mutation post ($lang: String!, $code: String!, $ephemeral: Boolean!) {
      postTask(lang: $lang, code: $code, ephemeral: $ephemeral)
    }
  `;
  const token = await user.getToken();
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  const ephemeral = true;
  return client.request(query, { lang, code, ephemeral }).then(data => data.postTask);
};

export const buildSaveTask = ({ setNewTask }) => async ({ user, lang, code, mark, isPublic = false }) => {
  const query = gql`
    mutation post ($lang: String!, $code: String!, $mark: Int!, $isPublic: Boolean) {
      saveTask(lang: $lang, code: $code, mark: $mark, isPublic: $isPublic)
    }
  `;
  const token = await user.getToken();
  //const request = buildRequestClient({ token });
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  const task = client.request(query, { lang, code, mark, isPublic }).then(data => JSON.parse(data.saveTask));
  setNewTask(task);
};

export const loadTasks = async ({ user, lang, mark }) => {
  if (!user) {
    return {};
  }
  const token = await user.getToken();
  //const request = buildRequestClient({ token });
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  const query = gql`
    query get($lang: String!, $mark: Int!) {
      tasks(lang: $lang, mark: $mark) {
        id
        lang,
        src
        isPublic
      }
    }
  `;
  return client.request(query, { lang, mark }).then(data => data.tasks);
};

export const loadCompiles = async ({ user, type }) => {
  if (!user) {
    return {};
  }
  const token = await user.getToken();
  //const request = buildRequestClient({ token });
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  const query = gql`
    query get($type: String!) {
      compiles(type: $type) {
        id
        data
        status
        timestamp
      }
    }
  `;
  return client.request(query, { type }).then(data => data.compiles);
};

export const loadGraphiQL = async ({ user }) => {
  if (!user) {
    return {};
  }
  const token = await user.getToken();
  console.log("loadGraphiQL() token=" + token);
  //const request = buildRequestClient({ token });
  const headers = {
    authorization: token,
    accept: "text/html",
  };
  const get = bent("https://console.graffiticode.com", "GET", "string");
  // const get = bent("http://localhost:3000", "GET", "string");
  const data = await get("/api", null, headers);
  console.log("loadGraphiQL() data=" + JSON.stringify(data));
  return data.replace(/\n/g, "").slice(15);
};

