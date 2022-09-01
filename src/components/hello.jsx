import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { incrementCount, decrementCount, resetCount, compileHello } from '../utils/redux/actions'
import Form from './forms/L0/src/form.jsx';

const Hello = () => {
  const dispatch = useDispatch();
  const hello = useSelector((state) => state.hello);
  useEffect(() => {
    dispatch(compileHello());
  });
  return (
    <div>
      <Form />
    </div>
  )
}

export default Hello
