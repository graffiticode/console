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

export const compile = async ({ user, id, data = {}, buildLayerCount = 0 }: { user: any; id: string; data?: any; buildLayerCount?: number }) => {
  try {
    // Preserve the head segment plus any build-time state layers
    // (planner-built upstreams). Runtime form state is the trailing
    // segment that gets stripped/replaced on each compile.
    const keep = 1 + Math.max(0, buildLayerCount);
    const segments = id.split("+");
    const hasFormData = Object.keys(data).length > 0;
    // When there's runtime formData, drop any trailing runtime-state
    // segment so the api server reposts the new state cleanly.
    // Otherwise preserve the full chain so a standalone compile uses
    // the build-time layers as `data`.
    const sliceTo = hasFormData ? Math.min(keep, segments.length) : segments.length;
    id = segments.slice(0, sliceTo).join("+");
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

export const parse = async ({ user, lang, src, itemId }: { user: any; lang: string; src: string; itemId?: string }) => {
  const token = await user.getToken();
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  const query = gql`
    query parse($lang: String!, $src: String!, $itemId: String) {
      parse(lang: $lang, src: $src, itemId: $itemId) {
        code
        errors { message from to }
      }
    }
  `;
  return client.request(query, { lang, src, itemId }).then(data => data.parse);
};

export const postTask = async ({ user, lang, code, item }: { user: any, lang: string, code: string, item?: string }) => {
  const query = gql`
    mutation post ($lang: String!, $code: String!, $ephemeral: Boolean!, $item: String) {
      postTask(lang: $lang, code: $code, ephemeral: $ephemeral, item: $item)
    }
  `;
  const token = await user.getToken();
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  const ephemeral = true;
  return client.request(query, { lang, code, ephemeral, item }).then(data => data.postTask);
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

export const getData = async ({ user, id }) => {
  // console.log(
  //   "getData()",
  //   "id=" + id,
  // );
  if (!user) {
    return {};
  }

  // Removed unused data parameter and associated logic that was causing issues
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

export const getSpec = async ({ user, id }) => {
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
    query getSpec($id: String!) {
      spec(id: $id) {
        spec
        lang
        itemId
        coverage { checked missing }
      }
    }
  `;
  return client.request(query, { id }).then(data => data.spec);
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

export const countItems = async ({ user, langs }) => {
  if (!user) {
    return {};
  }
  const groups = await Promise.all(langs.map(lang => {
    // Count items across all surfaces (console/mcp/front), not just console.
    return loadItems({user, lang: lang.name.slice(1), mark: null, client: 'all'});
  }));
  const counts = {};
  groups.forEach((group, index) => {
    // Exclude mark 5 (black) from the Tools view count.
    counts[langs[index].name] = group.filter(it => it.mark !== 5).length;
  });
  return counts;
};

export const loadTaskVersions = async ({ user, lang, client: clientId, itemId, limit }: { user: any; lang: string; client?: string; itemId?: string; limit?: number }) => {
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
    query loadTaskVersions($lang: String!, $client: String, $itemId: String, $limit: Int) {
      taskVersions(lang: $lang, client: $client, itemId: $itemId, limit: $limit) {
        id
        itemId
        taskId
        lang
        langs
        name
        mark
        client
        source
        label
        createdAt
      }
    }
  `;
  return client.request(query, { lang, client: clientId, itemId, limit }).then(data => data.taskVersions);
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
export const loadItems = async ({ user, lang, mark, client: clientId }) => {
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
    query loadItems($lang: String!, $mark: Int, $client: String) {
      items(lang: $lang, mark: $mark, client: $client) {
        id
        name
        taskId
        lang
        mark
        help
        isPublic
        created
        updated
        sharedWith
        client
        upstreamLangs
      }
    }
  `;
  return client.request(query, { lang, mark, client: clientId }).then(data => data.items);
};

export const loadItemClientTags = async ({ user, lang }) => {
  if (!user) return [];
  const token = await user.getToken();
  const client = new GraphQLClient("/api", {
    headers: {
      authorization: token,
    }
  });
  const query = gql`
    query loadItemClientTags($lang: String!) {
      itemClientTags(lang: $lang)
    }
  `;
  return client.request(query, { lang }).then(data => data.itemClientTags || []);
};

export const createItem = async ({ user, lang, name, taskId, mark, help, isPublic, client: clientId, upstreamLangs }: { user: any; lang: string; name?: string; taskId?: string; mark?: number; help?: string; isPublic?: boolean; client?: string; upstreamLangs?: string[] }) => {
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
    mutation createItem($lang: String!, $name: String, $taskId: String, $mark: Int, $help: String, $isPublic: Boolean, $client: String, $upstreamLangs: [String!]) {
      createItem(lang: $lang, name: $name, taskId: $taskId, mark: $mark, help: $help, isPublic: $isPublic, client: $client, upstreamLangs: $upstreamLangs) {
        id
        name
        taskId
        lang
        mark
        help
        isPublic
        created
        updated
        client
        upstreamLangs
      }
    }
  `;
  return client.request(mutation, { lang, name, taskId, mark, help, isPublic, client: clientId, upstreamLangs }).then(data => data.createItem);
};

const credentialsClient = async (user: any) => {
  const token = await user.getToken();
  return new GraphQLClient("/api", { headers: { authorization: token } });
};

export const getCredentials = async ({ user }: { user: any }) => {
  if (!user) return [];
  const client = await credentialsClient(user);
  const query = gql`
    query credentials {
      credentials { name backend isPublic value masked updatedAt }
    }
  `;
  return client.request(query).then(data => data.credentials);
};

export const setCredential = async (
  { user, name, value, backend, isPublic }:
  { user: any; name: string; value: string; backend?: string; isPublic?: boolean },
) => {
  const client = await credentialsClient(user);
  const mutation = gql`
    mutation setCredential($name: String!, $value: String!, $backend: String, $isPublic: Boolean) {
      setCredential(name: $name, value: $value, backend: $backend, isPublic: $isPublic) { name backend isPublic value masked updatedAt }
    }
  `;
  return client.request(mutation, { name, value, backend, isPublic }).then(data => data.setCredential);
};

export const deleteCredential = async ({ user, name }: { user: any; name: string }) => {
  const client = await credentialsClient(user);
  const mutation = gql`
    mutation deleteCredential($name: String!) {
      deleteCredential(name: $name)
    }
  `;
  return client.request(mutation, { name }).then(data => data.deleteCredential);
};

export const updateItem = async ({ user, id, name, taskId, mark, help, isPublic, client: clientId, upstreamLangs, source }: { user: any; id: string; name?: string; taskId?: string; mark?: number; help?: string; isPublic?: boolean; client?: string; upstreamLangs?: string[]; source?: string }) => {
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
    mutation updateItem($id: String!, $name: String, $taskId: String, $mark: Int, $help: String, $isPublic: Boolean, $client: String, $upstreamLangs: [String!], $source: String) {
      updateItem(id: $id, name: $name, taskId: $taskId, mark: $mark, help: $help, isPublic: $isPublic, client: $client, upstreamLangs: $upstreamLangs, source: $source) {
        id
        name
        taskId
        lang
        mark
        help
        isPublic
        created
        updated
        client
        upstreamLangs
      }
    }
  `;
  return client.request(mutation, { id, name, taskId, mark, help, isPublic, client: clientId, upstreamLangs, source }).then(data => data.updateItem);
};

export const shareItem = async ({ user, itemId, targetUserId }) => {
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
    mutation shareItem($itemId: String!, $targetUserId: String!) {
      shareItem(itemId: $itemId, targetUserId: $targetUserId) {
        success
        message
        newItemId
      }
    }
  `;
  return client.request(mutation, { itemId, targetUserId }).then(data => data.shareItem);
};

export const getUsers = async () => {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data.usersData || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
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
        langs
        code
        src
      }
    }
  `;
  return client.request(query, { id }).then(data => data.task);
};

export const getTaskLangs = async ({ user, id }) => {
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
    query getTaskLangs($id: String!) {
      task(id: $id) {
        id
        lang
        langs
      }
    }
  `;
  return client.request(query, { id }).then(data => data.task);
};

export const getItem = async ({ user, id }) => {
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
    query getItem($id: String!) {
      item(id: $id) {
        id
        name
        taskId
        lang
        mark
        help
        isPublic
        created
        updated
        client
        upstreamLangs
      }
    }
  `;
  return client.request(query, { id }).then(data => data.item);
};

export const generateCode = async ({ user, prompt, language, options, currentSrc, conversationSummary = null, itemId = undefined }) => {
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
    mutation GenerateCode($prompt: String!, $language: String!, $options: CodeGenerationOptions, $currentSrc: String, $conversationSummary: ConversationSummaryInput, $itemId: String) {
      generateCode(prompt: $prompt, language: $language, options: $options, currentSrc: $currentSrc, conversationSummary: $conversationSummary, itemId: $itemId) {
        src
        taskId
        description
        language
        model
        usage {
          input_tokens
          output_tokens
        }
        errors {
          message
          from
          to
        }
        upstreamLangs
      }
    }
  `;

  // Prepare the variables
  const variables = {
    prompt,
    language,
    options,
    currentSrc,
    conversationSummary,
    itemId,
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

