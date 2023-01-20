import {
  UPDATE_TASK,
  UPDATE_LANG,
  UPDATE_MARK,
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

export const postTask = ({ uid, lang, code }) => (dispatch, getState) => {
  const query = gql `
    mutation post ($uid: String!, $lang: String!, $code: String!, $ephemeral: Boolean!) {
      postTask(uid: $uid, lang: $lang, code: $code, ephemeral: $ephemeral)
    }
  `;
  const state = getState();
  const ephemeral = true;
  const post = async ({uid, lang, code, ephemeral}) => {
    request('/api', query, {uid, lang, code, ephemeral}).then((data) => {
      const id = data.postTask;
      dispatch(updateTask(id));
    });
  };
  post({uid, lang, code, ephemeral}).catch(console.error);
};

export const saveTask = ({ uid, lang, code, mark }) => (dispatch, getState) => {
  const query = gql `
    mutation post ($uid: String!, $lang: String!, $code: String!, $mark: Int!) {
      saveTask(uid: $uid, lang: $lang, code: $code, mark: $mark)
    }
  `;
  const state = getState();
  const post = async ({uid, lang, code, mark}) => {
    request('/api', query, {uid, lang, code, mark}).then((data) => {
      const { taskId, id, image, imageUrl } = JSON.parse(data.saveTask);
      dispatch(addTask({
        [taskId]: [{id, lang, code, mark, image, imageUrl}]
      }));
    });
  };
  post({uid, lang, code, mark}).catch(console.error);
};

export const loadTasks = ({ uid, lang, mark }) => (dispatch, getState) => {
  if (!uid) {
    return {};
  }
  const query = gql `
    query get($uid: String!, $lang: String!, $mark: Int!) {
      getTasks(uid: $uid, lang: $lang, mark: $mark)
    }
  `;
  const get = async ({ uid, lang, mark }) => {
    request('/api', query, { uid, lang, mark }).then((data) => {
      const tasks = JSON.parse(data.getTasks);
      dispatch(initTasks(tasks));
    });
  };
  get({uid, lang, mark}).catch(console.error);
};

export const updateTask = (data) => ({ type: UPDATE_TASK, data });
export const updateLang = (data) => ({ type: UPDATE_LANG, data });
export const updateMark = (data) => ({ type: UPDATE_MARK, data });
export const addTask = (data) => ({ type: ADD_TASK, data });
export const initTasks = (data) => ({ type: INIT_TASKS, data });
export const setUserId = (data) => ({ type: SET_USER_ID, data });
