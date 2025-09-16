import { Fragment, memo, useCallback, useEffect, useState, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline'
import Editor from './editor';
import SignIn from "./SignIn";
import { isNonEmptyString } from "../utils";
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";

const useTaskIdFormUrl = ({ accessToken, lang, id, origin }) => {
  if (!id) {
    return "";
  }
  const [ protocol, host ] =
        document.location.host.indexOf("localhost") === 0 && ["http", "localhost:3100"] ||
        ["https", "api.graffiticode.org"];
  const params = new URLSearchParams();
  if (accessToken) {
    params.set("access_token", accessToken);
  }
  if (origin) {
    params.set("origin", origin);
  }
  return `${protocol}://${host}/form?lang=${lang}&id=${id}&${params.toString()}`;
};

const HEIGHTS = [150, 240, 360, 480, 640, 860, 1020];

const cache = {};

const IFrame = ({ id, src, setData, className, width, height, onFocus }) => (
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin === window.location.origin) {
        return;
      }
      // Check for focus events first
      if (event.data.focus) {
        onFocus && onFocus(event.data.focus);
        // Also dispatch a custom event that HelpPanel can listen to
        const focusEvent = new CustomEvent('formIFrameFocus', {
          detail: { focus: event.data.focus }
        });
        window.dispatchEvent(focusEvent);
        return;
      }
      const data = event.data[id];
      if (!data) {
        return;
      }
      const hash = JSON.stringify(data);
      if (cache[id] !== hash) {
        cache[id] = hash;
        setData && setData(data);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [id, onFocus]),
  <iframe
    id={id}
    src={src}
    key="1"
    className={className}
    style={{ width: "100%", height: height || "100vh", border: "none" }}
  />
);

const getHeight = (height, newHeight) => {
  if (newHeight === height) {
    return height;
  } else if (newHeight > HEIGHTS[HEIGHTS.length - 1]) {
    return HEIGHTS[HEIGHTS.length - 1];
  } else {
    return HEIGHTS.find((h, i) => newHeight < h && h);
  }
};

export const FormIFrame = ({
  accessToken,
  lang,
  id,
  setData,
  setId,
  data,
  className,
  height,
  onFocus
}) => {
  const origin = window.location.origin;
  const src = useTaskIdFormUrl({accessToken, lang, id, origin});
  return (
    <IFrame
      id={id}
      src={src}
      setData={setData}
      onFocus={onFocus}
      className={className || "w-full h-full"}
      width="100%"
      height={height || "100vh"}
    />
  );
};
