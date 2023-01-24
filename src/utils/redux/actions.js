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

export const updateTask = (data) => ({ type: UPDATE_TASK, data });
export const updateLang = (data) => ({ type: UPDATE_LANG, data });
export const updateMark = (data) => ({ type: UPDATE_MARK, data });
export const addTask = (data) => ({ type: ADD_TASK, data });
export const initTasks = (data) => ({ type: INIT_TASKS, data });
export const setUserId = (data) => ({ type: SET_USER_ID, data });
