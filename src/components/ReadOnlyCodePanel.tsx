import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getTask } from '../utils/swr/fetchers';

export const ReadOnlyCodePanel = ({ id, user }: any) => {
  const [code, setCode] = useState("");

  console.log("ReadOnlyCodePanel() - Component rendered with:", { id, user: !!user });

  const { data: taskData, error, isLoading } = useSWR(
    user && id ? [`getTask-${id}`, { user, id }] : null,
    ([_, params]) => {
      console.log("ReadOnlyCodePanel() - Calling getTask with params:", params);
      return getTask(params);
    }
  );

  console.log("ReadOnlyCodePanel() - SWR state:", { taskData, error, isLoading, hasData: !!taskData });

  useEffect(() => {
    console.log(
      "ReadOnlyCodePanel() - useEffect triggered",
      "taskData=" + JSON.stringify(taskData, null, 2),
    );

    if (taskData) {
      console.log("ReadOnlyCodePanel() - taskData.code:", taskData.code);

      if (taskData.code) {
        setCode(taskData.code);
        console.log("ReadOnlyCodePanel() - Set code from taskData.code:", taskData.code);
      } else {
        console.log("ReadOnlyCodePanel() - No code field found in taskData");
      }
    }
  }, [taskData]);

  if (error) {
    console.error("ReadOnlyCodePanel() - Error loading task:", error);
  }

  // The code is now unparsed source code, not JSON
  // Display it directly as a string
  return (
    code ? (
      <div className="p-4">
        <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
          <code className="text-sm font-mono">{code}</code>
        </pre>
      </div>
    ) : (
      <div className="p-4 text-gray-500">No code available</div>
    )
  );
};
