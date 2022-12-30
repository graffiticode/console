import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { useSession, signIn, signOut } from "next-auth/react";
import dashify from 'dashify';
import axios from 'axios';
import { useRouter } from 'next/router';
import { setUserId, loadTasks } from '../utils/redux/actions'

export default function SignIn() {
  const router = useRouter();
  const dispatch = useDispatch();
  const userId = useSelector(state => state.userId);
  const mark = useSelector(state => state.mark || 1);
  const { data: session } = useSession();
  if (session) {
    const postUser = async () => {
      const userRes = await axios.post('/api/user', { ...session.user });
      const resData = userRes.data;
      const id = resData.id;
      //await dispatch(loadTasks({uid: id, mark}));
      // Turn off for now.
      // const secretRes = await axios.get(`/api/secret?id=${id}`);
      // const { client_secret: clientSecret } = secretRes.data;
      dispatch(setUserId(id));
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
