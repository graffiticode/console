import { request, gql } from 'graphql-request';

export const tasksSettings = ({ uid, lang, mark }) => {
  const query = gql `
    mutation post ($uid: String!, $lang: String!, $mark: Int!) {
      tasksSettings(uid: $uid, lang: $lang, mark: $mark)
    }
  `;
  const post = ({uid, lang, mark}) => {
    request('/api', query, {uid, lang, mark}).then((data) => console.log(JSON.stringify(data) && data));
  };
  return post({uid, lang, mark});
}

/*
function App () {
  const { data, error } = useSWR({uid, lang, mark}, tasksSettings);
  // ...
}
*/
