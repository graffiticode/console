import useSWR from "swr";
import { Fragment, useCallback, useEffect, useState, useRef } from 'react'
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
import L0001Form from "./l0001/src/pages/[type].jsx";

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

const IFrameForm = ({ accessToken, lang, id, setId, data, className }) => {
  const [ height, setHeight ] = useState("480px");
  window.addEventListener(
    "message",
    (event) => {
      const { height, id } = event.data;
      if (height) {
//        setHeight(height + "px");
      }
      if (id) {
        console.log("IFrameForm() id=" + id);
        setId && setId(id);
      }
    },
    false,
  );
  const src = useTaskIdFormUrl({ accessToken, lang, id });
  return (
    <iframe
      key="1"
      src={src}
      className={className}
      width="100%"
      height={height}
    />
  );
};

const ReactForm = ({ accessToken, lang, id, data }) => {
  switch (lang) {
  case "0001":
    return (
      <L0001Form
        accessToken={accessToken}
        lang={lang}
        id={id}
        data={data}
      />
    );
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

export default function FormView({ key, lang, id, setId, setNewTask, className }) {
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
      />
    </div>
  );
}
