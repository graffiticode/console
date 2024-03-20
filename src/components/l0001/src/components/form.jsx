import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function isNonNullObject(obj) {
  return (typeof obj === "object" && obj !== null);
}

function renderJSON(data, depth = 0) {
  return (
    <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
  );
}

function render(props) {
  const { value } = props;
  console.log("render() value=|" + value + "|");
  if (value) {
    return value;
  } else {
    return renderJSON(props);
  }
}

export const Form = ({ state }) => {
  return (
    <div className="bg-gray-100 p-2">
      {
        render(state)
      }
    </div>
  );
}

Form.propTypes = {
  state: PropTypes.object.required,
};

Form.defaultProps = {
  state: {},
};
