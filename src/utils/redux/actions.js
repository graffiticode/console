import {
  TICK,
  INCREMENT,
  DECREMENT,
  RESET,
  HELLO,
  RENDER_TASK,
  SET_USER_ID,
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
      console.log("addPayment() getData() hello=" + data.addPayment);
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
  console.log("compileTask() state=" + JSON.stringify(state, null, 2));
  const getData = async ({user, lang, code}) => {
    console.log("compileTask() user=" + user + " lang=" + lang + " code=" + code);
    request('/api', query, { user, lang, code }).then((data) => {
      console.log("compileTask() getData() data=" + data.compileTask);
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
  console.log("saveTask() state=" + JSON.stringify(state, null, 2));
  const post = async ({user, lang, code}) => {
    console.log("saveTask() user=" + user + " lang=" + lang + " code=" + code);
    request('/api', query, { user, lang, code }).then((data) => {
      console.log("saveTask() post() saveTask=" + data.saveTask);
      //dispatch(renderTask(JSON.parse(data.saveTask)));
    });
  };
  post({ user, lang, code }).catch(console.error);
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

// INCREMENT COUNTER BY 1
export const incrementCount = () => ({ type: INCREMENT });

// DECREMENT COUNTER BY 1
export const decrementCount = () => ({ type: DECREMENT });

// RESET COUNTER
export const resetCount = () => ({ type: RESET });

export const sayHello = (data) => ({ type: HELLO, data });

export const renderTask = (data) => ({ type: RENDER_TASK, data });

export const setUserId = (data) => ({ type: SET_USER_ID, data });

//export const showPayment = (data) => ({ type: SHOW_PAYMENT, data });
