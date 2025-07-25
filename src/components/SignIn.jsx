import useArtcompilerAuth from "../hooks/use-artcompiler-auth";

export default function SignInComponent({ label = "Sign in" }) {
  const { loading, user, signInWithEthereum, signOut } = useArtcompilerAuth();

  const handleSignIn = async () => {
    try {
      await signInWithEthereum();
    } catch (err) {
      console.error(err);
    }
  };

  if (user) {
    return <button disabled={loading} onClick={signOut}>{`${user.uid.slice(0, 7)}...${user.uid.slice(33)}`} (Sign out)</button>;
  } else {
    return <button disabled={loading} onClick={handleSignIn}>{label}</button>;
  }
}
