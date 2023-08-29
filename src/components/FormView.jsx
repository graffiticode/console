import useSWR from "swr";
import { Fragment, useCallback, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRight
} from '@heroicons/react/24/outline'
import Editor from './editor';
import SignIn from "./SignIn";
import { loadTasks } from '../utils/swr/fetchers';
import { isNonEmptyString } from "../utils";
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import { Form as l150Form } from "./forms/l150/src/pages/[type].jsx";
import { Form as l1Form } from "./forms/l1/src/pages/[type].jsx";

const useTaskIdFormUrl = ({ lang, id, user }) => {
  const { data: src } = useSWR({ user, id }, async ({ user, id }) => {
    if (!id) {
      return "";
    }
    const [ protocol, host ] =
          document.location.host.indexOf("localhost") === 0 && ["http", "localhost:3100"] ||
          ["https", "api.graffiticode.org"];
    const token = await user.getToken();
    const params = new URLSearchParams();
    if (token) {
      params.set("access_token", token);
    }
    return `${protocol}://${host}/form?lang=${lang}&id=${id}&${params.toString()}`;
  });
  return src;
};

const FormIFrame = ({url, className}) => {
  console.log("FormIFrame() url=" + url);
  return (
    <iframe
      src={url}
      className={className}
      width="100%"
      height="100%"
    />
  );
};

const FormFrame = ({ user, id, lang }) => {
  console.log("FormFrame() lang=" + lang + " id=" + id);
  let Form;
  switch (lang) {
  case "150":
    Form = l150Form;
    break;
  case "1":
  default:
    Form = l1Form;
    break;
  }
  return <Form user={user} lang={lang} id={id} />
};

const staticForms = ["150"];

export default function FormView({ lang, id }) {
  const [open, setOpen] = useState(true);
  const [task, setTask] = useState();
  const [taskId, setTaskId] = useState();
  const [newTask, setNewTask] = useState();
  const [dataId, setDataId] = useState();
  const { user } = useGraffiticodeAuth();
  const url = useTaskIdFormUrl({ lang, id, user });
  console.log("FormView() url=" + url);
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

  const Form = staticForms.includes(lang) && FormFrame || FormIFrame;
  return (
    <div className="justify-center min-w-full">
      <Form
        lang={lang}
        id={id}
        url={url}
        user={user}
        className="w-full h-screen"
      />
    </div>
  );
}
