/*
  This example requires Tailwind CSS v2.0+

  This example requires some changes to your config:

  ```
  // tailwind.config.js
  ```
*/
import BillingCard from "./BillingCard";
import APIKeysCard from "./APIKeysCard";
import SignIn from "./SignIn";
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";

export default function Example() {
  const { user } = useGraffiticodeAuth();
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <SignIn
          className="rounded-none border-2 px-3 py-2 text-center hover:border-gray-400 focus:outline-none"
          label={<span className="block font-medium">Sign in to continue</span>}
        />
      </div>
    );
  } else {
    return (
      <div>
        <div className="relative pt-10">
          <div className="border lg:grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x">
            <aside className="py-6 lg:col-span-3">
              <span className="mx-5 text-xl font-bold">API Keys</span>
            </aside>
            <div className="lg:col-span-9">
              <APIKeysCard />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
