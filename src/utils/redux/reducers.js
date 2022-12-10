import { combineReducers } from 'redux';
import {
  HELLO,
  UPDATE_TASK,
  ADD_TASK,
  INIT_TASKS,
  SET_USER_ID,
} from './types';

const helloReducer = (state = "", { type, data }) => {
  switch (type) {
  case HELLO:
    return data;
  default:
    return state;
  }
};

const taskIdReducer = (state = "", { type, data }) => {
  switch (type) {
  case UPDATE_TASK:
    return data;
  default:
    return state;
  }
};

const addTaskReducer = (state = {}, { type, data }) => {
  switch (type) {
  case ADD_TASK:
    return {...state, ...data};
  case INIT_TASKS:
    return data;
  default:
    return state;
  }
};

const userIdReducer = (state = "", { type, data }) => {
  switch (type) {
  case SET_USER_ID:
    return data;
  default:
    return state;
  }
};

// COMBINED REDUCERS
const reducers = {
  hello: helloReducer,
  id: taskIdReducer,
  userId: userIdReducer,
  tasks: addTaskReducer,
};

export default combineReducers(reducers);
