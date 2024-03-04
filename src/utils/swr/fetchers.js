import bent from "bent";
import { GraphQLClient, gql } from 'graphql-request';
import { postApiCompile } from "../../lib/api";

const buildRequestClient = async ({ token }) => {
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  return client;
};

export const compile = async ({ user, id, data }) => {
  data = data || {};
  try {
    const token = await user.getToken();
    const index = Object.keys(data).length > 0 && 1 || 2; // Empty data so use full id.
    id = id.split("+").slice(0, index).join("+");  // Re-compile state with code id.
    const accessToken = await user.getToken();
    const resp = await postApiCompile({ accessToken, id, data });
    return resp;
  } catch (x) {
    console.trace("./swr/fetchers/compile()");
    console.log(x.stack);
  }
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

export const buildSaveTask = () => async ({ user, id, lang, code, mark, isPublic = false }) => {
  const query = gql`
    mutation post ($id: String, $lang: String!, $code: String!, $mark: Int!, $isPublic: Boolean) {
      saveTask(id: $id, lang: $lang, code: $code, mark: $mark, isPublic: $isPublic)
    }
  `;
  const token = await user.getToken();
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  return await client.request(
    query, {
      id, lang, code, mark, isPublic
    }).then(data => JSON.parse(data.saveTask));
};

export const updateTask = async ({ user, id, name, mark }) => {
  console.log("updateTask() id=" + id);
  const query = gql`
    mutation post ($id: String, $name: String, $mark: Int) {
      updateTask(id: $id, name: $name, mark: $mark)
    }
  `;
  const token = await user.getToken();
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  return await client.request(query, {id, name, mark}).then(data => JSON.parse(data.updateTask));
};

export const loadTasks = async ({ user, lang, mark }) => {
  console.log("loadTasks() lang=" + lang + " mark=" + mark);
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

export const getData = async ({ user, id, data }) => {
  if (!user) {
    return {};
  }

  let dataId = 0;
  if (data && Object.keys(data).length > 0) {
    const code = `${JSON.stringify(data)}..`;
    dataId = await postTask({user, lang: "0001", code});
    id = `${id}+${dataId}`;
  }
  const token = await user.getToken();
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  const query = gql`
    query get($id: String!) {
      data(id: $id)
    }
  `;
  return client.request(query, { id }).then(data => JSON.parse(data.data));
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

export const getAccessToken = async ({ user }) => {
  if (!user) {
    return null;
  }
  return await user.getToken();
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

