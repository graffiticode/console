import Clock from './clock';
import Counter from './counter';
import Hello from './hello';
import L114Form from './forms/L114/src/Form.jsx';
const Examples = () => {
  return (
    <div style={{ marginBottom: 10 }}>
      <Clock />
      <Counter />
      <L104Form items="1,2,3,4"/>
    </div>
  )
};

export default Examples;
