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
  // console.log(
  //   "compile()",
  // );
  data = data || {};
  try {
    const token = await user.getToken();
    const index = Object.keys(data).length > 0 && 1 || 2; // Empty data so use full id.
    id = id.split("+").slice(0, index).join("+");  // Re-compile state with code id.
    const accessToken = await user.getToken();
    const resp = await postApiCompile({ accessToken, id, data });
    return resp;
  } catch (x) {
    console.log(
      "swr/compile",
      "Error " + x.stack,
    );
  }
};

export const postTask = async ({ user, lang, code }) => {
  console.log(
    "postTask()",
    "lang=" + lang,
    "code=" + code,
  );
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

export const saveTask = async ({ user, id, lang, code, help, mark, isPublic = false }) => {
  console.log(
    "buildSaveTask()",
    "help=" + JSON.stringify(help, null, 2),
  );
  const query = gql`
    mutation post ($id: String, $lang: String!, $code: String!, $help: String!, $mark: Int!, $isPublic: Boolean) {
      saveTask(id: $id, lang: $lang, code: $code, help: $help, mark: $mark, isPublic: $isPublic)
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
      id, lang, code, help: JSON.stringify(help), mark, isPublic
    }).then(data => JSON.parse(data.saveTask));
};

export const postTaskUpdates = async ({ user, tasks }) => {
  console.log(
    "postTaskUpdates()",
    "tasks=" + JSON.stringify(tasks, null, 2),
  );
  const query = gql`
    mutation post ($id: String, $name: String, $help: String, $mark: Int, $isPublic: Boolean) {
      updateTask(id: $id, name: $name, help: $help, mark: $mark, isPublic: $isPublic)
    }
  `;
  const token = await user.getToken();
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  await Promise.all(tasks.forEach(async ({id, name, help, mark, isPublic }) => {
    await client.request(query, {id, name, help: JSON.stringify(help), mark, isPublic}).then(data => JSON.parse(data.updateTask));
  }));
  return {};
};

export const loadTasks = async ({ user, lang, mark }) => {
  // console.log(
  //   "loadTasks()",
  // );
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
        help
        isPublic
        created
        name
        mark
      }
    }
  `;
  return client.request(query, { lang, mark }).then(data => data.tasks);
};

export const getData = async ({ user, id, data }) => {
  // console.log(
  //   "getData()",
  //   "id=" + id,
  // );
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
  // console.log(
  //   "countTasks()",
  // );
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
  // console.log(
  //   "loadCompiles()",
  // );
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

/**
 * Generate code using the GraphQL API
 *
 * @param {Object} params - Parameters for code generation
 * @param {string} params.prompt - The code description or requirements
 * @param {string} [params.language] - Optional target programming language
 * @param {Object} [params.options] - Additional generation options
 * @returns {Promise<Object>} - Generated code and metadata
 */
export const loadItems = async ({ user, lang, mark }) => {
  if (!user) {
    return [];
  }
  const token = await user.getToken();
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  const query = gql`
    query loadItems($lang: String!, $mark: Int) {
      items(lang: $lang, mark: $mark) {
        id
        name
        taskId
        lang
        mark
        help
        code
        isPublic
        created
        updated
      }
    }
  `;
  return client.request(query, { lang, mark }).then(data => data.items);
};

export const createItem = async ({ user, lang, name, taskId, mark, help, code, isPublic }) => {
  if (!user) {
    return null;
  }
  const token = await user.getToken();
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  const mutation = gql`
    mutation createItem($lang: String!, $name: String, $taskId: String, $mark: Int, $help: String, $code: String, $isPublic: Boolean) {
      createItem(lang: $lang, name: $name, taskId: $taskId, mark: $mark, help: $help, code: $code, isPublic: $isPublic) {
        id
        name
        taskId
        lang
        mark
        help
        code
        isPublic
        created
        updated
      }
    }
  `;
  return client.request(mutation, { lang, name, taskId, mark, help, code, isPublic }).then(data => data.createItem);
};

export const updateItem = async ({ user, id, name, taskId, mark, help, code, isPublic }) => {
  if (!user) {
    return null;
  }
  const token = await user.getToken();
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  const mutation = gql`
    mutation updateItem($id: String!, $name: String, $taskId: String, $mark: Int, $help: String, $code: String, $isPublic: Boolean) {
      updateItem(id: $id, name: $name, taskId: $taskId, mark: $mark, help: $help, code: $code, isPublic: $isPublic) {
        id
        name
        taskId
        lang
        mark
        help
        code
        isPublic
        created
        updated
      }
    }
  `;
  return client.request(mutation, { id, name, taskId, mark, help, code, isPublic }).then(data => data.updateItem);
};

export const getTask = async ({ user, id }) => {
  if (!user || !id) {
    return null;
  }
  const token = await user.getToken();
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  const query = gql`
    query getTask($id: String!) {
      task(id: $id) {
        id
        lang
        src
        code
        help
        isPublic
        taskId
        created
        name
        mark
      }
    }
  `;
  return client.request(query, { id }).then(data => data.task);
};

export const generateCode = async ({ user, prompt, language, options, currentCode }) => {
  console.log(
    "fetchers/generateCode()",
    "language=" + language,
    "currentCode length=" + (currentCode ? currentCode.length : 0)
  );
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
    mutation GenerateCode($prompt: String!, $language: String, $options: CodeGenerationOptions, $currentCode: String) {
      generateCode(prompt: $prompt, language: $language, options: $options, currentCode: $currentCode) {
        code
        taskId
        description
        language
        model
        usage {
          input_tokens
          output_tokens
        }
      }
    }
  `;

  // Prepare the variables
  const variables = {
    prompt,
    language,
    options,
    currentCode
  };

  try {
    const result = await client.request(query, variables);
    console.log(
      "fetchers/generateCode()",
      "result=" + JSON.stringify(result, null, 2),
    );
    return result.generateCode;
  } catch (error) {
    console.error("Error in generateCode fetcher:", error);
    throw new Error(`Failed to generate code: ${error.message}`);
  }
};

