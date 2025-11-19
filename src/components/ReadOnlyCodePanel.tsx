import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getTask } from '../utils/swr/fetchers';

export const ReadOnlyCodePanel = ({ id, user }: any) => {
  const [code, setCode] = useState("");

  const { data: taskData, error, isLoading } = useSWR(
    user && id ? [`getTask-${id}`, { user, id }] : null,
    ([_, params]) => getTask(params)
  );

  useEffect(() => {
    if (taskData?.code) {
      setCode(taskData.code);
    }
  }, [taskData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

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
