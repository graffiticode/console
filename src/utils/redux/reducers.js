import { combineReducers } from 'redux';
import * as types from './types';

const helloReducer = (state = "", { type, data }) => {
  switch (type) {
  case types.HELLO:
    return data;
  default:
    return state;
  }
};

const taskReducer = (state = "", { type, data }) => {
  switch (type) {
  case types.RENDER_TASK:
    return data;
  default:
    return state;
  }
};

const addTaskReducer = (state = ['Create Task'], { type, data }) => {
  switch (type) {
  case types.ADD_TASK:
    return state.includes(data) && state || [data].concat(state);
  default:
    return state;
  }
};

// COUNTER REDUCER
const counterReducer = (state = 0, { type, data }) => {
  switch (type) {
  case types.INCREMENT:
    return state + 1;
  case types.DECREMENT:
    return state - 1;
  case types.RESET:
    return 0;
  default:
    return state;
  }
};

// INITIAL TIMER STATE
const initialTimerState = {
  lastUpdate: 0,
  light: false,
};

// TIMER REDUCER
const timerReducer = (state = initialTimerState, { type, payload }) => {
  switch (type) {
  case types.TICK:
    return {
      lastUpdate: payload.ts,
      light: !!payload.light,
    };
  default:
    return state;
  }
};

const userIdReducer = (state = "", { type, data }) => {
  console.log("userIdReducer() type=" + type + " data=" + data);
  switch (type) {
  case types.USER_ID:
    return data;
  default:
    return state;
  }
};

// COMBINED REDUCERS
const reducers = {
  counter: counterReducer,
  timer: timerReducer,
  hello: helloReducer,
  chart: taskReducer,
  userId: userIdReducer,
  tasks: addTaskReducer,
};

export default combineReducers(reducers);
