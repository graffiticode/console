import { CheckIcon, HandThumbUpIcon, UserIcon } from '@heroicons/react/20/solid'

const timeline = [
  {
    id: 1,
    content: 'L148',
    target: 'eyJ0YXNrSWRzIjpbInNuUjh4a1U2N01sQ0lTOFl5RUJUIl19',
    href: '#',
    datetime: 'Feb 09, 2021, 11:12:13:0904 AM UTC-8',
    icon: CheckIcon,
    iconBackground: 'bg-green-500',
  },
  {
    id: 2,
    content: 'L148',
    target: 'eyJ0YXNrSWRzIjpbIndIcEFEcmJEaVdrdXZuTFFCamV4Il19',
    href: '#',
    datetime: 'Feb 09, 2021, 11:12:14:0901 AM UTC-8',
    icon: CheckIcon,
    iconBackground: 'bg-green-500',
  },
  {
    id: 3,
    content: 'L148',
    target: 'eyJ0YXNrSWRzIjpbIlByZmU1ZWxnR0xiS1A2dkltWmdiIl19',
    href: '#',
    datetime: 'Feb 09, 2021, 11:12:15:0001 AM UTC-8',
    icon: CheckIcon,
    iconBackground: 'bg-green-500',
  },
  {
    id: 4,
    content: 'L148',
    target: 'eyJ0YXNrSWRzIjpbIkJ6NU1SQWRlQUtDMzBDajZKcUpjIl19',
    href: '#',
    datetime: 'Feb 09, 2021, 11:12:15:0010 AM UTC-8',
    icon: CheckIcon,
    iconBackground: 'bg-green-500',
  },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Timeline() {
  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {timeline.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-4">
              {false && eventIdx !== timeline.length - 1 ? (
                <span className="absolute top-4 left-2 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={classNames(
                      event.iconBackground,
                      'h-4 w-4 rounded-full flex items-center justify-center ring-8 ring-white'
                    )}
                  >
                    <event.icon className="h-4 w-4 text-white" aria-hidden="true" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-0 font-medium text-sm text-gray-500 hover:text-black">
                  <div>
                    <p className="">
                      {event.content}{' '}
                      <a href={event.href} className="">
                        {event.target}
                      </a>
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right">
                    <time dateTime={event.datetime}>{event.datetime}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
