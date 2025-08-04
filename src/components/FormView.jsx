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
import { FormIFrame } from "./FormIFrame";
import { FormReact } from "./FormReact";
//const reactForms = ["0002"];
const reactForms = [];

export default function FormView({ lang, id, setData, setId, setNewTask, className, height }) {
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

  const Form = reactForms.includes(lang) && FormReact || FormIFrame;
  return (
    <div className="justify-center min-w-full h-full">
      <Form
        accessToken={accessToken}
        lang={lang}
        id={id}
        setData={setData}
        setId={setId}
        className={className}
        height={height}
        user={user}
      />
    </div>
  );
}
