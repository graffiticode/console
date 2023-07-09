import { client } from "../lib/auth";
import { useToken } from "../hooks/use-graffiticode-auth";

export default function APIKeysCard() {
  const { data: token } = useToken();

  return (
    <div className="overflow-hidden bg-white">
      <div className="px-4 py-5 sm:p-0">
        <dl className="">
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
            <button onClick={async () => {
              // const { apiKey } = await client.apiKeys.create(token);
              // const { access_token } = await client.apiKeys.authenticate({ apiKey });
              // console.log(access_token);
            }}>Create API Key</button>
          </div>
        </dl>
      </div>
    </div>
  )
}
