import { ClipboardIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useRef } from "react";
import { useCopyToClipboard } from "react-use";

export default function NewAPIKeyDialog({ apiKey }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, copyToClipboard] = useCopyToClipboard();

  useEffect(() => {
    if (!ref || !ref.current) {
      return;
    }
    console.log(apiKey);
    if (apiKey?.token) {
      ref.current.showModal();
    } else {
      ref.current.close();
    }
  }, [ref, apiKey]);

  return (
    <dialog ref={ref} className="rounded bg-white text-gray-900 m-auto p-4">
      <div className="font-bold text-xl mb-2 text-center">New API Key Created</div>
      <div className="flex items-center text-gray-800 border border-gray-800 bg-white font-mono text-sm py-3 px-4 mb-1 rounded">
        <span className="font-semibold">ID</span>
        <span className="flex-1 text-slate-500 text-ellipsis overflow-hidden ml-2">{apiKey?.id}</span>
        <button className="" onClick={() => copyToClipboard(apiKey?.id)}>
          <ClipboardIcon className="h-6 w-6 text-gray-500" />
        </button>
      </div>
      <div className="flex items-center text-gray-800 border border-gray-800 bg-white font-mono text-sm py-3 px-4 mb-1 rounded">
        <span className="font-semibold">Secret</span>
        <span className="flex-1 text-slate-500 text-ellipsis overflow-hidden ml-2">{apiKey?.token}</span>
        <button onClick={() => copyToClipboard(apiKey?.token)}>
          <ClipboardIcon className="h-6 w-6 text-gray-500" />
        </button>
      </div>
      {state.error && <p className="text-danger">Unable to copy value: {state.error.message}</p>}
      <p className="text-xs text-slate-500">The key&apos;s token will only be shown this once. Copy to a safe place to use later.</p>
      <div className="flex justify-end items-center mt-2">
        <form method="dialog">
          <button
            className="inline-block rounded bg-primary px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white">
            OK
          </button>
        </form>
      </div>
    </dialog>
  );
}
