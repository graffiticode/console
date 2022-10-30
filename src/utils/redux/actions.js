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

export const saveTask = ({ user, lang, code }) => (dispatch, getState) => {
  const query = gql `
    mutation post ($user: String!, $lang: String!, $code: String!) {
      saveTask(user: $user, lang: $lang, code: $code)
    }
  `;
  const state = getState();
  const post = async ({user, lang, code}) => {
    request('/api', query, { user, lang, code }).then((data) => {
      const taskId = JSON.parse(data.saveTask);
      dispatch(addTask({
        [taskId]: [{lang, code}]
      }));
    });
  };
  post({ user, lang, code }).catch(console.error);
};

export const loadTasks = ({ uid }) => (dispatch, getState) => {
  const query = gql `
    query get($uid: String!) {
      getTasks(uid: $uid)
    }
  `;
  const get = async ({ uid }) => {
    request('/api', query, { uid }).then((data) => {
      const tasks = JSON.parse(data.getTasks);
      dispatch(initTasks(tasks));
    });
  };
  get({uid}).catch(console.error);
};

// INITIALIZES CLOCK ON SERVER
export const serverRenderClock = () => (dispatch) =>
  dispatch({
    type: TICK,
    payload: { light: false, ts: Date.now() },
  });

// INITIALIZES CLOCK ON CLIENT
export const startClock = () => (dispatch) =>
  setInterval(() => {
    dispatch({
      type: TICK,
      payload: { light: true, ts: Date.now() }
    });
  }, 5000);

export const renderTask = (data) => ({ type: RENDER_TASK, data });

export const addTask = (data) => ({ type: ADD_TASK, data });

export const initTasks = (data) => ({ type: INIT_TASKS, data });

export const setUserId = (data) => ({ type: SET_USER_ID, data });
