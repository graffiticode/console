/*
  This example requires Tailwind CSS v2.0+

  This example requires some changes to your config:

  ```
  // tailwind.config.js
  ```
*/
import { useState, useEffect } from "react";
import BillingCard from "./BillingCard";
import APIKeysCard from "./APIKeysCard";
import InviteCodesCard from "./InviteCodesCard";
import SignIn from "./SignIn";
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";

export default function SettingsForm() {
  const { user } = useGraffiticodeAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkIfAdmin();
    }
  }, [user]);

  const checkIfAdmin = async () => {
    try {
      const token = await user.getToken();
      const response = await fetch("/api/user/admin-status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
    }
  };

  if (!user) {
    return (
      <div className="justify-center w-full">
        <SignIn
          className="rounded-none border-2 px-3 py-2 text-center hover:border-gray-400 focus:outline-none"
          label={<span className="block font-medium">Sign in to continue</span>}
        />
      </div>
    );
  } else {
    return (
      <div>
        <div className="relative space-y-8">
          <div className="border lg:grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x">
            <aside className="py-6 lg:col-span-3">
              <span className="mx-5 text-xl font-bold">API Keys</span>
            </aside>
            <div className="lg:col-span-9">
              <APIKeysCard />
            </div>
          </div>
          
          {isAdmin && (
            <div className="border lg:grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x">
              <aside className="py-6 lg:col-span-3">
                <span className="mx-5 text-xl font-bold">Invite Codes</span>
              </aside>
              <div className="lg:col-span-9">
                <InviteCodesCard />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}