import React, { useMemo } from 'react';
import useSWR from 'swr';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getSpec } from '../utils/swr/fetchers';

export function SpecPanel({ id, user }: any) {
  const { data: spec, error, isLoading } = useSWR(
    user && id ? [`getSpec-${id}`, { user, id }] : null,
    ([_, params]) => getSpec(params),
    { revalidateOnFocus: false }
  );

  const remarkPlugins = useMemo(() => [remarkGfm], []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No spec available — compile the item first.
      </div>
    );
  }

  if (!spec || !spec.spec) {
    return <div className="h-full bg-white" />;
  }

  return (
    <div className="h-full bg-white">
      <div className="prose prose-sm prose-blue max-w-none p-4">
        <ReactMarkdown remarkPlugins={remarkPlugins}>
          {spec.spec}
        </ReactMarkdown>
      </div>
    </div>
  );
}
