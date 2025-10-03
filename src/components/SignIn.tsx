import { useState } from "react";
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import WalletSelectionDialog from "./WalletSelectionDialog";

interface SignInComponentProps {
  label?: string | React.ReactNode;
  className?: string;
}

interface Wallet {
  name: string;
  provider: any;
}

export default function SignInComponent({ label = "Sign in", className }: SignInComponentProps) {
  const { loading, user, signInWithEthereum, signOut } = useGraffiticodeAuth();
  const [showWalletDialog, setShowWalletDialog] = useState(false);

  const handleSignInClick = () => {
    // Always show wallet selection dialog
    setShowWalletDialog(true);
  };

  const handleSignIn = async (wallet: Wallet | null) => {
    try {
      await signInWithEthereum(wallet);
    } catch (err) {
      console.error(err);
    }
  };

  const handleWalletSelect = (wallet: Wallet) => {
    handleSignIn(wallet);
  };

  if (user) {
    return (
      <button className={className} disabled={loading} onClick={signOut}>
        {`${user.uid.slice(0, 7)}...${user.uid.slice(33)}`} (Sign out)
      </button>
    );
  } else {
    return (
      <>
        <button
          className={className}
          disabled={loading}
          onClick={handleSignInClick}
        >
          {label}
        </button>

        <WalletSelectionDialog
          isOpen={showWalletDialog}
          onClose={() => setShowWalletDialog(false)}
          onSelectWallet={handleWalletSelect}
        />
      </>
    );
  }
}
