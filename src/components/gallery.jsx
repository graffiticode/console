import charts from './charts.json' assert {type: 'json'};
/* This example requires Tailwind CSS v2.0+ */
import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const files = [
  {
    source:
      'https://cdn.acx.ac/xV2Ud8VXs5nIQrmZ2c7.png',
  },
  {
    source:
      'https://cdn.acx.ac/o5dSVpbziL5fbz8mBCA.png',
  },
  {
    source:
      'https://cdn.acx.ac/MxRF0xqwSJXSqmmv4I9.png',
  },
  {
    source:
      'https://cdn.acx.ac/l1aFezOzU5oIeRaPKtL.png',
  },
  {
    source:
      'https://cdn.acx.ac/l1aFe7vRi5oIe4g6QCL.png',
  },
]

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.slice(0, 1000);
}


// export default function Example() {
//   return (
//     <ul role="list" className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-6 lg:grid-cols-6 xl:gap-x-8">
//       {shuffleArray(charts).map((chart) => (
//         <li key={chart} className="relative">
//           <div className="group block w-full overflow-hidden rounded-none bg-white hover:ring-1 hover:ring-gray-400">
//             <a href={`https://f7s.acx.ac/item?id=${chart}`} target="GC">
//               <img src={`https://cdn.acx.ac/${chart}.png`} alt="" className="pointer-events-none object-cover group-hover:opacity-75" />
//             </a>
//             {/*
//             <button type="button" className="absolute inset-0 focus:outline-none">
//               <span className="sr-only">View details for {file.title}</span>
//             </button>
//             */}
//           </div>
//         </li>
//       ))}
//     </ul>
//   )
// }


export default function Example() {
  const [open, setOpen] = useState(true)

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <div className="fixed inset-0" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900">Panel title</Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            onClick={() => setOpen(false)}
                          >
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      {/* Replace with your content */}
                      <div className="absolute inset-0 px-4 sm:px-6">
                        <div className="h-full border-2 border-dashed border-gray-200" aria-hidden="true" />
                      </div>
                      {/* /End replace */}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
