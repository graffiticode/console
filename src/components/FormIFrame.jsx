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

const useTaskIdFormUrl = ({ accessToken, lang, id }) => {
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
  return `${protocol}://${host}/form?lang=${lang}&id=${id}&${params.toString()}`;
};

const HEIGHTS = [150, 240, 360, 480, 640, 860, 1020];

const IFrame = ({ id, src, className, width, height }) =>
  <iframe
    id={id}
    src={src}
    key="1"
    className={className}
    width="100%"
    height={height}
  />;

const getHeight = (height, newHeight) => {
  if (newHeight === height) {
    return height;
  } else if (newHeight > HEIGHTS[HEIGHTS.length - 1]) {
    return HEIGHTS[HEIGHTS.length - 1];
  } else {
    return HEIGHTS.find((h, i) => newHeight < h && h);
  }
};

export const FormIFrame = ({ accessToken, lang, id, setId, data, className, height }) => {
  window.addEventListener(
    "message",
    (event) => {
      const { id } = event.data;
      if (id) {
        setId && setId(id);
      }
    },
    false,
  );

  const src = useTaskIdFormUrl({ accessToken, lang, id });
  return (
    <IFrame
      id={id}
      src={src}
      className={className}
      width="100%"
      height={height}
    />
  );
};
