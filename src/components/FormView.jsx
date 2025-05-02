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
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Authentication Required</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                To access this form, please sign in. New users will need an invite code to register.
              </p>
            </div>
            <div className="mt-5">
              <SignIn
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                label="Sign in"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { uid } = user;

  const Form = reactForms.includes(lang) && FormReact || FormIFrame;
  return (
    <div className="justify-center min-w-full">
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
