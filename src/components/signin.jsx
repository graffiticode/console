import { useEffect } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import dashify from 'dashify';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function SignIn() {
  const router = useRouter();
  const { data: session } = useSession();
  if (session) {
    console.log("SignIn() session=" + JSON.stringify(session, null, 2));
    const postUser = async () => {
      const userRes = await axios.post('/api/user', { ...session.user });
      const { id } = userRes.data;
      const secretRes = await axios.get(`/api/secret?id=${id}`);
      const { client_secret: clientSecret } = secretRes.data;
      console.log("postUser() clientSecret=" + clientSecret);      
    }
    postUser().catch(console.error);
    return (
      <>
        <button onClick={() => signOut()}>{session.user.name} (Sign out)</button>
      </>
    );
  } else {
    return (
      <>
        <button onClick={ signIn }>Sign in</button>
      </>
    );
  }
}
