import {
  RENDER_TASK,
  SET_USER_ID,
  ADD_TASK,
  INIT_TASKS,
} from './types';
import { request, gql } from 'graphql-request';

export const addPayment = () => (dispatch, getState) => {
  const query = gql `
    mutation post ($id: String!) {
      addPayment(id: $id)
    }
  `;
  const state = getState();
  const getData = async () => {
    const id = `${state.id}`;
    request('/api', query, { id }).then((data) => {
      dispatch(showPayment(data.stripeSecret));
    });
  };
  getData().catch(console.error);
};

export const compileTask = ({ user, lang, code }) => (dispatch, getState) => {
  console.log("compileTask() lang=" + lang);
  const query = gql `
    mutation post ($user: String!, $lang: String!, $code: String!) {
      compileTask(user: $user, lang: $lang, code: $code)
    }
  `;
  const state = getState();
  const getData = async ({user, lang, code}) => {
    request('/api', query, { user, lang, code }).then((data) => {
      dispatch(renderTask(JSON.parse(data.compileTask)));
    });
  };
  getData({ user, lang, code }).catch(console.error);
};

export const saveTask = ({ user, lang, code, data }) => (dispatch, getState) => {
  const query = gql `
    mutation post ($user: String!, $lang: String!, $code: String!) {
      saveTask(user: $user, lang: $lang, code: $code)
    }
  `;
  const state = getState();
  console.log("saveTask() state=" + JSON.stringify(state, null, 2));
  const post = async ({user, lang, code, data}) => {
    request('/api', query, { user, lang, code }).then((data) => {
      const { id } = JSON.parse(data.saveTask);
      dispatch(addTask({
        [id]: [{lang, code, data}]
      }));
    });
  };
  post({ user, lang, code, data }).catch(console.error);
};

export const loadTasks = ({ uid }) => (dispatch, getState) => {
  const query = gql `
    query get($uid: String!) {
      getTasks(uid: $uid)
    }
  `;
  const get = async ({ uid }) => {
    console.log("loadTasks() uid=" + uid);
    request('/api', query, { uid }).then((data) => {
      const tasks = JSON.parse(data.getTasks);
      dispatch(initTasks(tasks));
    });
  };
  get({uid}).catch(console.error);
};

export const renderTask = (data) => ({ type: RENDER_TASK, data });

export const addTask = (data) => ({ type: ADD_TASK, data });

export const initTasks = (data) => ({ type: INIT_TASKS, data });

export const setUserId = (data) => ({ type: SET_USER_ID, data });
