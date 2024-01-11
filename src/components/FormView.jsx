import useSWR from "swr";
import { Fragment, useCallback, useState } from 'react'
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
  const { data: src } = useSWR({ accessToken, id }, async ({ accessToken, id }) => {
    if (!id) {
      return "";
    }
    const [ protocol, host ] =
          document.location.host.indexOf("localhost") === 0 && ["http", "localhost:3100"] ||
          ["https", "api.graffiticode.org"];
    const params = new URLSearchParams();
    if (token) {
      params.set("access_token", accessToken);
    }
    return `${protocol}://${host}/form?lang=${lang}&id=${id}&${params.toString()}`;
  });
  return src;
};

const FormIFrame = ({ accessToken, lang, id, data }) => {
  console.log("FormIFrame() lang=" + lang);
  const url = useTaskIdFormUrl({ lang, id, accessToken });
  return (
    <iframe
      key="1"
      src={url}
      width="100%"
      height="100%"
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

const staticForms = ["0001"];

export default function FormView({ lang, id }) {
  const [open, setOpen] = useState(true);
  const [task, setTask] = useState();
  const [taskId, setTaskId] = useState();
  const [newTask, setNewTask] = useState();
  const [dataId, setDataId] = useState();
  const { user } = useGraffiticodeAuth();
  const { isValidating, isLoading, data: accessToken } = useSWR(
    user && { user } || null,
    getAccessToken,
  );
  console.log("FormView() user=" + JSON.stringify(user));
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
  // const tasks = data || [];

  if (newTask && !tasks.some(task => task.id === newTask.id)) {
    tasks.unshift(newTask);
  }

  console.log("FormView() lang=" + lang + " id=" + id + " accessToken=" + accessToken);

  const Form = staticForms.includes(lang) && ReactForm || FormIFrame;
  return (
    <div className="justify-center min-w-full">
      <Form
        accessToken={accessToken}
        lang={lang}
        id={id}
      />
    </div>
  );
}
