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
    return `/api/form/${id}?${params.toString()}`;
  });
  return src;
};

const FormIframe = ({key, src, className}) => (
  <iframe
    key={key}
    className={className}
    src={src}
    width="100%"
    height="100%"
  />);

export default function FormView({ id }) {
  console.log("FormView() id=" + id);
  const [open, setOpen] = useState(true);
  const [hideEditor, setHideEditor] = useState(true);
  const [task, setTask] = useState();
  const [taskId, setTaskId] = useState();
  const [newTask, setNewTask] = useState();
  const [dataId, setDataId] = useState();
  const { user } = useGraffiticodeAuth();
  const src = useTaskIdFormUrl({ id });

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

  // console.log("FormView() tasks=" + JSON.stringify(tasks, null, 2));

  if (newTask && !tasks.some(task => task.id === newTask.id)) {
    tasks.unshift(newTask);
  }
  const hideForm = false;
  return (
    <FormIframe
      key={2}
      src={src}
      className="w-full h-screen"
    />
  );
}
