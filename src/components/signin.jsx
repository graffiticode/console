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
      const res = await axios.post('/api/user', { ...session.user });
      console.log("postUser() res.data=" + JSON.stringify(res.data, null, 2));
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
