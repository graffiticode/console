import * as types from './types';
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
      console.log("getData() hello=" + data.compileHello);
      dispatch(showPayment(data.stripeSecret));
    });
  };
  getData().catch(console.error);
};

export const compileHello = (name) => (dispatch, getState) => {
  const query = gql `
    mutation post ($name: String!) {
      compileTask(name: $name)
    }
  `;
  const state = getState();
  const getData = async (name) => {
    const msg = `hello, ${name}!`;
    request('/api', query, { name }).then((data) => {
      console.log("getData() hello=" + data.compileTask);
      dispatch(sayHello(data.compileTask));
    });
  };
  getData(String(name)).catch(console.error);
};

export const compileTask = ({ lang, code }) => (dispatch, getState) => {
  const query = gql `
    mutation post ($lang: String!, $code: String!) {
      compileTask(lang: $lang, code: $code)
    }
  `;
  //const state = getState();
  const getData = async ({lang, code}) => {
    console.log("compileTask() lang=" + lang + " code=" + code);
    request('/api', query, { lang, code }).then((data) => {
      console.log("getData() hello=" + data.compileTask);
      dispatch(sayHello(data.compileTask));
    });
  };
  getData({ lang, code }).catch(console.error);
};

export const getItems = () => (dispatch, getState) => {
  const query = gql `
    query get($filter: String!) {
      getItems(filter: $filter)
    }
  `;
  const state = getState();
  const getData = async () => {
    const filter = `${state.filter}`;
    request('/api', query, { filter }).then((data) => {
      console.log("getData() hello=" + data.compileHello);
      dispatch(sayHello(data.compileHello));
    });
  };
  getData().catch(console.error);
};

// INITIALIZES CLOCK ON SERVER
export const serverRenderClock = () => (dispatch) =>
  dispatch({
    type: types.TICK,
    payload: { light: false, ts: Date.now() },
  });

// INITIALIZES CLOCK ON CLIENT
export const startClock = () => (dispatch) =>
  setInterval(() => {
    dispatch({
      type: types.TICK,
      payload: { light: true, ts: Date.now() }
    });
  }, 5000);

// INCREMENT COUNTER BY 1
export const incrementCount = () => ({ type: types.INCREMENT });

// DECREMENT COUNTER BY 1
export const decrementCount = () => ({ type: types.DECREMENT });

// RESET COUNTER
export const resetCount = () => ({ type: types.RESET });

export const sayHello = (data) => ({ type: types.HELLO, data });

export const showPayment = (data) => ({ type: types.SHOW_PAYMENT, data });
