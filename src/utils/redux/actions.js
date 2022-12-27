import {
  UPDATE_TASK,
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

export const postTask = ({ lang, code, ephemeral }) => (dispatch, getState) => {
  const query = gql `
    mutation post ($lang: String!, $code: String!, $ephemeral: Boolean) {
      postTask(lang: $lang, code: $code, ephemeral: $ephemeral)
    }
  `;
  const state = getState();
  const ephemeral = true;
  const post = async ({lang, code, ephemeral}) => {
    request('/api', query, {lang, code, ephemeral}).then((data) => {
      const id = data.postTask;
      dispatch(updateTask(id));
    });
  };
  post({ lang, code, ephemeral }).catch(console.error);
};

export const saveTask = ({ uid, lang, code }) => (dispatch, getState) => {
  const query = gql `
    mutation post ($uid: String!, $lang: String!, $code: String!) {
      saveTask(uid: $uid, lang: $lang, code: $code)
    }
  `;
  const state = getState();
  const post = async ({uid, lang, code}) => {
    request('/api', query, {uid, lang, code}).then((data) => {
      const { id, image, imageUrl } = JSON.parse(data.saveTask);
      dispatch(addTask({
        [id]: [{lang, code, image, imageUrl}]
      }));
    });
  };
  post({uid, lang, code}).catch(console.error);
};

export const hideTask = ({ uid, lang, code }) => (dispatch, getState) => {
  const query = gql `
    mutation post ($uid: String!, $lang: String!, $code: String!) {
      hideTask(uid: $uid, lang: $lang, code: $code)
    }
  `;
  const state = getState();
  const post = async ({uid, lang, code}) => {
    request('/api', query, {uid, lang, code}).then((data) => {
      const { id } = JSON.parse(data.hideTask);
      dispatch(hideTask({
        [id]: [{lang, code, image, imageUrl}]
      }));
    });
  };
  post({uid, lang, code}).catch(console.error);
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

export const updateTask = (data) => ({ type: UPDATE_TASK, data });

export const addTask = (data) => ({ type: ADD_TASK, data });

export const initTasks = (data) => ({ type: INIT_TASKS, data });

export const setUserId = (data) => ({ type: SET_USER_ID, data });
