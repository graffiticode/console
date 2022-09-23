/* This example requires Tailwind CSS v2.0+ */
import { PaperClipIcon } from '@heroicons/react/20/solid'

export default function Example() {
  return (
    <div className="overflow-hidden bg-white">
      <div className="px-4 py-5 sm:p-0">
        <dl className="">
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">API secret</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              Add payment to get an API key
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
