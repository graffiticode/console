import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import { useEffect } from "react";
import useSWR from "swr";
import { loadGraphiQL } from '../utils/swr/fetchers';
import SignIn from '../components/SignIn'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

let token;

export default function GraphiQL() {
  // FIXME add auth to fetch requests.
  const { user } = useGraffiticodeAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <SignIn
          label="Sign in to continue"
        />
      </div>
    );
  }

  (async (user) => {
    token = user && await user.getToken();
  })(user)
  return <embed src={`${location.origin}/api?auth_token=${token}`} width="100%" height="100%"/>;
}
