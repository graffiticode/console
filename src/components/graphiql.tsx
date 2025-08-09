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
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="justify-center w-full">
        <SignIn
          label="Sign in to continue"
        />
      </div>
      </div>
    );
  }

  (async (user) => {
    token = user && await user.getToken();
  })(user)
  return <embed src={`${location.origin}/api?auth_token=${token}`} width="100%" height="100%"/>;
}
