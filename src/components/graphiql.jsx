import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import { useEffect } from "react";
import useSWR from "swr";
import { loadGraphiQL } from '../utils/swr/fetchers';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

let token;

export default function GraphiQL() {
  // FIXME add auth to fetch requests.
  const { user } = useGraffiticodeAuth();
  (async (user) => {
    token = await user.getToken();
    console.log("token=" + token);
  })(user)
  // return <embed src={`http://localhost:3000/api?auth_token=${token}`} width="100%" height="100%"/>;
  return <embed src={`https://console.graffiticode.com/api?auth_token=${token}`} width="100%" height="100%"/>;
}
