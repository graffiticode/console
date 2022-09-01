import { useSelector, useDispatch } from 'react-redux'
import { incrementCount, decrementCount, resetCount, compileHello } from '../utils/redux/actions'
import Hello from './forms/L0/src/form.jsx';

const Counter = () => {
  const count = useSelector((state) => state.counter);
  const dispatch = useDispatch();

  const handleIncrement = () => {
    dispatch(incrementCount());
    dispatch(compileHello())
  };

  const handleDecrement = () => {
    dispatch(decrementCount());
    dispatch(compileHello())
  };

  const handleReset = () => {
    dispatch(resetCount());
    dispatch(compileHello())
  };

  return (
    <div>
      <div className="mt-2 text-xl"><Hello /></div>
      <button className="border-2 px-2 py-1 mb-2 mr-2" onClick={handleIncrement}>+1</button>
      <button className="border-2 px-2 py-1 mb-2 mr-2" onClick={handleDecrement}>-1</button>
      <button className="border-2 px-2 py-1 mb-2 mr-2" onClick={handleReset}>Reset</button>
    </div>
  )
}

export default Counter
