import { useState, useEffect } from "react";
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import InviteCodeDialog from "./InviteCodeDialog";

export default function SignInComponent({ label = "Sign in" }) {
  const { loading, user, signInWithEthereum, signOut } = useGraffiticodeAuth();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);

  useEffect(() => {
    // Check if user needs verification when user changes
    if (user && !verificationChecked) {
      checkUserVerification();
    }
  }, [user, verificationChecked]);

  const checkUserVerification = async () => {
    try {
      const token = await user.getToken();
      console.log("Checking user verification for:", user.uid.slice(0, 7));
      const response = await fetch("/api/check-user-verification", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to check user verification status");
      }
      
      const data = await response.json();
      console.log("Verification check response:", data);
      
      // With the workaround in place, this should always be false
      if (data.needsInviteCode) {
        console.log("User needs invite code, showing dialog");
        setShowInviteDialog(true);
      } else {
        console.log("User is verified, no invite code needed");
      }
      
      setVerificationChecked(true);
    } catch (err) {
      console.error("Error checking user verification:", err);
      setVerificationChecked(true); // Prevent infinite loop on error
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithEthereum();
      setVerificationChecked(false); // Reset verification check when signing in
    } catch (err) {
      console.error(err);
    }
  };

  const handleInviteSubmit = () => {
    setShowInviteDialog(false);
    // Refresh the page to apply changes
    window.location.reload();
  };

  if (user) {
    return (
      <>
        <button disabled={loading} onClick={signOut}>
          {`${user.uid.slice(0, 7)}...${user.uid.slice(33)}`} (Sign out)
        </button>
        
        {showInviteDialog && (
          <InviteCodeDialog 
            onClose={() => setShowInviteDialog(false)} 
            onSubmit={handleInviteSubmit}
          />
        )}
      </>
    );
  } else {
    return <button disabled={loading} onClick={handleSignIn}>{label}</button>;
  }
}