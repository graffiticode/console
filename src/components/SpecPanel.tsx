import React, { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getSpec } from '../utils/swr/fetchers';

/**
 * `onLoaded` hands the RAW markdown up to the editor, which owns the Copy All button.
 *
 * Raw, not the rendered DOM: a spec is written to be pasted into another language's create_item
 * (or an agent's context), and for a dialect whose spec is a developer recipe the headings and
 * numbered verification steps are load-bearing structure. Copying the rendered text would flatten
 * exactly the part that makes it followable.
 */
export function SpecPanel({ id, user, onLoaded }: any) {
  const { data: spec, error, isLoading } = useSWR(
    user && id ? [`getSpec-${id}`, { user, id }] : null,
    ([_, params]) => getSpec(params),
    { revalidateOnFocus: false }
  );

  const remarkPlugins = useMemo(() => [remarkGfm], []);

  // Publish on every transition, including back to empty: the button must disappear while a
  // different item is loading rather than stay live over the previous item's text.
  const text = (!isLoading && !error && spec?.spec) || "";
  useEffect(() => { onLoaded?.(text); }, [text, onLoaded]);

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
