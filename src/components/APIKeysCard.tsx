import { TrashIcon } from "@heroicons/react/24/outline";
import { getIdToken } from "firebase/auth";
import { collection, orderBy, query, where } from "firebase/firestore";
import { useFirestore, useFirestoreCollectionData, useUser } from "reactfire";
import moment from "moment";
import { client } from "../lib/auth";
import NewAPIKeyDialog from "./NewAPIKeyDialog";
import { useState } from "react";

function APIKeyListItem({ user, apiKey }) {
  const buildHandleDelete = (apiKey) => async () => {
    const { id } = apiKey;
    const token = await getIdToken(user);
    await client.apiKeys.remove({ token, id });
  };
  return (
    <li className="flex items-center justify-between border border-gray-300 px-4 py-1 rounded-none">
      <div className="flex flex-col">
        <span>{apiKey.id}</span>
        <small className="mb-2 text-sm text-neutral-500 dark:text-neutral-400 font-light italic">
          Created {moment(apiKey.createdAt.toDate()).format("MMMM Do YYYY, h:mm:ss a")}
        </small>
      </div>
      <button
        type="button"
        className="inline-block rounded-none"
        onClick={buildHandleDelete(apiKey)}>
        <TrashIcon className="h-6 w-6 text-blue-500" />
      </button>
    </li>
  );
}

export default function APIKeysCard() {
  const firestore = useFirestore();
  const { data: user } = useUser();
  const apiKeysQuery = query(
    collection(firestore, "api-keys"),
    where("uid", "==", user.uid),
    orderBy("createdAt"));
  const { status, data: apiKeys } = useFirestoreCollectionData(apiKeysQuery, { idField: "id" });
  const [newApiKey, setNewApiKey] = useState();

  const handleCreate = async () => {
    const userToken = await getIdToken(user);
    const apiKey = await client.apiKeys.create(userToken);
    setNewApiKey(apiKey);
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  } else if (status === "error") {
    return <div>
      <h1>Error</h1>
      <span className="mb-4 rounded-lg bg-danger-100 px-6 py-5 text-base text-danger-700"
        role="alert">
        Opps! Something went wrong.
      </span>
    </div>;
  }

  return (
    <div className="overflow-hidden bg-white grid grid-col-1 m-2">
      <div className="m-1">
      <button
        type="button"
        className="inline-block rounded-none bg-gray-400 pt-2.5 text-xs font-medium uppercase leading-normal text-white px-6 pb-2"
        onClick={handleCreate}>
        Create API Key
      </button>
      </div>
      <ul className="list-disc space-y-2 m-1">
        {apiKeys.map(apiKey => (
          <APIKeyListItem key={apiKey.id} user={user} apiKey={apiKey} />
        ))}
      </ul>
      <NewAPIKeyDialog apiKey={newApiKey} />
    </div>
  )
}
