import { useState } from 'react';
import { useSelector } from 'react-redux'

export default function Form({data}) {
  return (
    <div>
      <div>{data}</div>
    </div>
  );
}

