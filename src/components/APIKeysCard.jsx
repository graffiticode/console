import { client } from "../lib/auth";
import { useToken } from "../hooks/use-graffiticode-auth";

export default function APIKeysCard() {
  const { data: userToken } = useToken();

  const handleCreate = () => {
    
  };

  return (
    <div className="overflow-hidden bg-white grid grid-col-1 gap-4">
      <div className="">
        <button type="button" className="inline-block rounded bg-primary px-6" onClick={async () => {
          const { token } = await client.apiKeys.create(userToken);
          const authContext = await client.apiKeys.authenticate({ token });
          console.log(authContext);
        }}>Create API Key</button>
        <button
          type="button"
          class="inline-block rounded bg-success px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#14a44d] transition duration-150 ease-in-out hover:bg-success-600 hover:shadow-[0_8px_9px_-4px_rgba(20,164,77,0.3),0_4px_18px_0_rgba(20,164,77,0.2)] focus:bg-success-600 focus:shadow-[0_8px_9px_-4px_rgba(20,164,77,0.3),0_4px_18px_0_rgba(20,164,77,0.2)] focus:outline-none focus:ring-0 active:bg-success-700 active:shadow-[0_8px_9px_-4px_rgba(20,164,77,0.3),0_4px_18px_0_rgba(20,164,77,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(20,164,77,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(20,164,77,0.2),0_4px_18px_0_rgba(20,164,77,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(20,164,77,0.2),0_4px_18px_0_rgba(20,164,77,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(20,164,77,0.2),0_4px_18px_0_rgba(20,164,77,0.1)]">
          Create API Key
        </button>
      </div>
    </div>
  )
}
