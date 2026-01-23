import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getTask } from '../utils/swr/fetchers';
import { unparse } from '../lib/unparse';
import { getLanguageLexicon } from '../lib/api';

type CodeTab = 'source' | 'ast';

export const ReadOnlyCodePanel = ({ id, user, onCodeChange }: any) => {
  const [ast, setAst] = useState("");
  const [source, setSource] = useState("");
  const [activeTab, setActiveTab] = useState<CodeTab>('source');
  const [lexicon, setLexicon] = useState<any>(null);

  const { data: taskData, isLoading } = useSWR(
    user && id ? [`getTask-${id}`, { user, id }] : null,
    ([_, params]) => getTask(params)
  );

  // Fetch lexicon when lang changes
  useEffect(() => {
    if (taskData?.lang) {
      getLanguageLexicon(taskData.lang).then(setLexicon);
    }
  }, [taskData?.lang]);

  // Update source and AST when taskData or lexicon changes
  useEffect(() => {
    if (taskData?.code) {
      setAst(taskData.code);
      try {
        const astObj = JSON.parse(taskData.code);
        const sourceCode = unparse(astObj, lexicon || {});
        setSource(sourceCode || "");
        onCodeChange?.(sourceCode || taskData.code);
      } catch {
        setSource("");
        onCodeChange?.(taskData.code);
      }
    }
  }, [taskData, lexicon, onCodeChange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const displayCode = activeTab === 'source' ? source : ast;

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-gray-200 mb-2">
        <button
          onClick={() => setActiveTab('source')}
          className={`px-3 py-1 text-xs font-medium ${
            activeTab === 'source'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Source
        </button>
        <button
          onClick={() => setActiveTab('ast')}
          className={`px-3 py-1 text-xs font-medium ${
            activeTab === 'ast'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          AST
        </button>
      </div>
      {displayCode ? (
        <div className="flex-1 overflow-auto p-2">
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            <code className="text-sm font-mono whitespace-pre-wrap">{displayCode}</code>
          </pre>
        </div>
      ) : (
        <div className="p-4 text-gray-500">No code available</div>
      )}
    </div>
  );
};
