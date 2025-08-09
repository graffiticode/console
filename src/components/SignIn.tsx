import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";

interface SignInComponentProps {
  label?: string | React.ReactNode;
  className?: string;
}

export default function SignInComponent({ label = "Sign in", className }: SignInComponentProps) {
  const { loading, user, signInWithEthereum, signOut } = useGraffiticodeAuth();

  const handleSignIn = async () => {
    try {
      await signInWithEthereum();
    } catch (err) {
      console.error(err);
    }
  };

  if (user) {
    return <button className={className} disabled={loading} onClick={signOut}>{`${user.uid.slice(0, 7)}...${user.uid.slice(33)}`} (Sign out)</button>;
  } else {
    return <button className={className} disabled={loading} onClick={handleSignIn}>{label}</button>;
  }
}
