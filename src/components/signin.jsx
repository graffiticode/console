import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { useSession, signIn, signOut } from "next-auth/react";
import dashify from 'dashify';
import axios from 'axios';
import { useRouter } from 'next/router';
import { setUserId } from '../utils/redux/actions'

export default function SignIn({ userId, setUserId }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  console.log("SignIn() typeof userId=" + typeof userId);
  if (session) {
    console.log("SignIn() session=" + JSON.stringify(session, null, 2));
    const postUser = async () => {
      const userRes = await axios.post('/api/user', { ...session.user });
      const { id } = userRes.data;
      console.log("SignIn userId=" + userId);
      const secretRes = await axios.get(`/api/secret?id=${id}`);
      const { client_secret: clientSecret } = secretRes.data;
      setUserId(id);
    }
    if (userId === "" || userId === undefined) {
      postUser().catch(console.error);
    }
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
