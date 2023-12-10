import { useEffect } from 'react';
import { getTitle } from '../lib/utils';
import Link from 'next/link';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Spec({ language }) {
  const langId = language.name.slice(1);
  useEffect(() => {
    document.title = getTitle();
  }, []);
  return (
    <iframe
      type="text/html"
      className="w-full h-screen"
      width="100%"
      height="100%"
      src="http://localhost:3100/L0001/spec.html"
      />
  );
}
