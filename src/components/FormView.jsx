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

const useTaskIdFormUrl = ({ id }) => {
  const { user } = useGraffiticodeAuth();
  const { data: src } = useSWR({ user, id }, async ({ user, id }) => {
    if (!id) {
      return "";
    }
    const token = await user.getToken();
    const params = new URLSearchParams();
    if (token) {
      params.set("token", token);
    }
    return `/api/data/${id}?${params.toString()}`;
  });
  return src;
};

const FormIframe = ({src, className}) => {
  return (
    <iframe
      src={src}
      className={className}
      width="100%"
      height="100%"
    />
  );
};

import { Form as l150Form } from "./forms/l150/src/pages/[type].jsx";

const FormFrame = ({ id, url, user }) => {
  // const Form = import(src);
  //const Form = await import("./forms/l150/src/pages/[type].jsx");
  //console.log("FormFrame() Form=" + Form);
  return l150Form({ id, url, user });
};

export default function FormView({ id }) {
  console.log("FormView()");
  const [open, setOpen] = useState(true);
  const [hideEditor, setHideEditor] = useState(true);
  const [task, setTask] = useState();
  const [taskId, setTaskId] = useState();
  const [newTask, setNewTask] = useState();
  const [dataId, setDataId] = useState();
  const { user } = useGraffiticodeAuth();
  const url = useTaskIdFormUrl({ id });
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
  const hideForm = false;
  return (
    <FormFrame
      id={id}
      url={url}
      user={user}
      className="w-full h-screen"
    />
  );
}
