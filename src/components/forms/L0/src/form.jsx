import { useState } from 'react';
import { useSelector } from 'react-redux'

export default function Form() {
  const hello = useSelector((state) => state.hello);
  return (
    <div>
      <div>{hello}</div>
    </div>
  );
}

