import React, { useState, useEffect } from 'react';

function isNonNullObject(obj) {
  return (typeof obj === "object" && obj !== null);
}

function renderJSON(data, depth = 0) {
  return (
    <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
  );
}

function render({state}) {
  const { data } = state;
  if (data.val) {
    return data.val;
  } else {
    return renderJSON(data);
  }
}

export const Form = ({ state }) => {
  return (
    <div className="bg-gray-100 p-2">
      { render({state}) }
    </div>
  );
}
