import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { getData } from '../utils/swr/fetchers';
import { Form } from "@graffiticode/l0012";

const isNullOrEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;

export const DataPanel = ({
  id,
  user,
}) => {
  const [ data, setData ] = useState({});
  const [ doGetData, setDoGetData ] = useState(false);
  const [ copied, setCopied ] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setDoGetData(true);
  }, [id]);

  const getDataResp = useSWR(
    doGetData && { user, id } || null,
    getData
  );

  if (getDataResp.data) {
    const data = getDataResp.data;
    setData(data);
    setDoGetData(false);
  }

  const handleCopy = () => {
    if (containerRef.current) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(containerRef.current);
      selection.removeAllRanges();
      selection.addRange(range);

      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }

      selection.removeAllRanges();
    }
  };

  return (
    isNullOrEmptyObject(data) &&
      <div /> ||
      <div className="relative">
        <button
          className="absolute top-2 right-2 z-10 bg-white px-3 py-1 text-xs font-semibold text-gray-700 rounded-none border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          onClick={handleCopy}
        >
          {copied ? (
            <span className="text-green-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Copied!
            </span>
          ) : 'Copy All'}
        </button>
        <div ref={containerRef}>
          <Form
            state={{
              apply: () => {},
              data
            }}
          />
        </div>
      </div>
  );
}
