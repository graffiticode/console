import { useEffect } from 'react';
import { getPageTitle } from '../lib/utils';
import Link from 'next/link';
import { getBaseUrlForApi } from "../lib/api";

export default function Spec({ language }) {
  const langId = language.name.slice(1);
  const src = `${getBaseUrlForApi()}/L${langId}/spec.html`;
  useEffect(() => {
    document.title = getPageTitle();
  }, []);
  return (
    <iframe
      className="w-full h-screen"
      width="100%"
      height="100%"
      src={src}
    />
  );
}
