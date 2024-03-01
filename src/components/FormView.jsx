import useSWR from "swr";
import { Fragment, memo, useCallback, useEffect, useState, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline'
import Editor from './editor';
import SignIn from "./SignIn";
import { loadTasks, getAccessToken } from '../utils/swr/fetchers';
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

const IFrame = ({ id, key, src, className, width, height }) =>
  <iframe
    id={id}
    src={src}
    key="1"
    className={className}
    width="100%"
    height={height}
  />;


const getHeight = (height, newHeight) => {
  console.log("getHeight() height=" + height + " newHeight=" + newHeight);
  if (newHeight === height) {
    return height;
  } else if (newHeight > HEIGHTS[HEIGHTS.length - 1]) {
    return HEIGHTS[HEIGHTS.length - 1];
  } else {
    return HEIGHTS.find((h, i) => newHeight < h && h);
  }
};

const IFrameForm = ({ accessToken, lang, id, setId, data, className, height, setHeight }) => {
  window.addEventListener(
    "message",
    (event) => {
      const { height: newHeight, id } = event.data;
      if (newHeight) {
        setHeight(getHeight(height, newHeight));
      }
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

const ReactForm = ({ accessToken, lang, id, data }) => {
  switch (lang) {
  default:
    return <div>Form not found: {lang}</div>
  }
}

const DynamicReactForm = ({ src }) => {
  let Form;
  useEffect(() => {
    if (src) {
      (async () => {
        Form = await import(src);
      })();
    }
  }, []);
  return Form || <div />;
}

const staticForms = []; //["0001"];

export default function FormView({ key, lang, id, setId, setNewTask, className, height, setHeight }) {
  const [open, setOpen] = useState(true);
  const [task, setTask] = useState();
  const [dataId, setDataId] = useState();
  const { user } = useGraffiticodeAuth();
  const { isValidating, isLoading, data: accessToken } = useSWR(
    user && { user } || null,
    getAccessToken,
  );

  if (!user) {
    return (
      <div className="justify-center w-full">
        <SignIn
          className="rounded-none border-2 px-3 py-2 text-center hover:border-gray-400 focus:outline-none"
          label={<span className="block font-medium">Sign in to continue</span>}
        />
      </div>
    );
  }

  const { uid } = user;

  const Form = staticForms.includes(lang) && ReactForm || IFrameForm;
  return (
    <div key={key} className="justify-center min-w-full">
      <Form
        accessToken={accessToken}
        lang={lang}
        id={id}
        setId={setId}
        className={className}
        height={height}
        setHeight={setHeight}
      />
    </div>
  );
}
