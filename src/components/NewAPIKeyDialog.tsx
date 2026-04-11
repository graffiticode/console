import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useRef, useState } from "react";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button onClick={handleCopy} title="Copy to clipboard">
      {copied ? (
        <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-600" />
      ) : (
        <ClipboardDocumentIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
      )}
    </button>
  );
}

export default function NewAPIKeyDialog({ apiKey }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!ref || !ref.current) {
      return;
    }
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
        <CopyButton value={apiKey?.id || ''} />
      </div>
      <div className="flex items-center text-gray-800 border border-gray-800 bg-white font-mono text-sm py-3 px-4 mb-1 rounded">
        <span className="font-semibold">Secret</span>
        <span className="flex-1 text-slate-500 text-ellipsis overflow-hidden ml-2">{apiKey?.token}</span>
        <CopyButton value={apiKey?.token || ''} />
      </div>
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
