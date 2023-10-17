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

export const buildSaveTask = () => async ({ user, lang, code, mark, isPublic = false }) => {
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
  return await client.request(query, { lang, code, mark, isPublic }).then(data => JSON.parse(data.saveTask));
  
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
        created
      }
    }
  `;
  return client.request(query, { lang, mark }).then(data => data.tasks);
};

export const countTasks = async ({ user, langs, mark }) => {
  if (!user) {
    return {};
  }
  const token = await user.getToken();
  const groups = await Promise.all(langs.map(lang => {
    return loadTasks({user, lang: lang.name.slice(1), mark});
  }));
  const counts = {};
  groups.forEach((group, index) => {
    counts[langs[index].name] = group.length;
  });
  return counts;
};

export const loadCompiles = async ({ user, lang, type }) => {
  if (!user) {
    return {};
  }
  const token = await user.getToken();
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  const query = gql`
    query get($lang: String!, $type: String!) {
      compiles(lang: $lang, type: $type) {
        id
        status
        timestamp
        lang
      }
    }
  `;
  return client.request(query, { lang, type }).then(data => data.compiles);
};

export const loadGraphiQL = async ({ user }) => {
  if (!user) {
    return {};
  }
  const token = await user.getToken();
  //const request = buildRequestClient({ token });
  const headers = {
    authorization: token,
    accept: "text/html",
  };
  const get = bent(location.origin, "GET", "string");
  const data = await get("/api", null, headers);
  return data.replace(/\n/g, "").slice(15);
};

