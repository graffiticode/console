import { useEffect } from 'react';
import { getTitle } from '../lib/utils';
import Link from 'next/link';
import { getBaseUrlForApi } from "../lib/api";

export default function Spec({ language }) {
  const langId = language.name.slice(1);
  const src = `${getBaseUrlForApi()}/L${langId}/docs.html`;
  console.log("Spec() src=" + src);
  useEffect(() => {
    document.title = getTitle();
  }, []);
  return (
    <iframe
      type="text/html"
      className="w-full h-screen"
      width="100%"
      height="100%"
      src={src}
    />
  );
}
