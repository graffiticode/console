/*
  This example requires some changes to your config:

  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
import { useState } from 'react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { Combobox } from '@headlessui/react'
import { getTitle } from '../lib/utils';

const languages = [
  {id: 1,  name: 'L0001', desc: "Base language", domains: ["hide"]},
  {id: 2,  name: 'L0002', desc: "Base language, v2", domains: ["graffiticode"]},
  {id: 3,  name: 'L0011', desc: "Property editors", domains: ["hide"]},
  {id: 4,  name: 'L0012', desc: "Object viewers", domains: ["hide"]},
  {id: 5,  name: 'L0137', desc: "Data transformers", domains: ["hide"]},
  {id: 6,  name: 'L0146', desc: "SVG scrapers", domains: ["hide"]},
  {id: 7,  name: 'L0147', desc: "Chart renderers", domains: ["hide"]},
  {id: 8,  name: 'L0150', desc: "Free shipping calculators", domains: ["hide"]},
  {id: 9,  name: 'L0151', desc: "Spreadsheet questions", domains: ["hide"]},
  {id: 10,  name: 'L0152', desc: "Interactive map questions", domains: ["hide"]},
  {id: 11, name: 'L0153', desc: "Area model questions", domains: ["hide"]},
  {id: 12, name: 'L0154', desc: "Magic square questions", domains: ["hide"]},
  {id: 13, name: 'L0155', desc: "Stoplight questions", domains: ["graffiticode"]},
  {id: 14, name: 'L0156', desc: "Short text scorers", domains: ["hide"]},
  {id: 15, name: 'L0157', desc: "Geoboard manipulatives", domains: ["hide"]},
  {id: 16, name: 'L0158', desc: "Learnosity integrations", domains: ["hide"]},
  {id: 17, name: 'L0159', desc: "Card games", domains: ["graffiticode"]},
  {id: 18, name: 'L0160', desc: "XML transformers", domains: ["hide"]},
  {id: 19, name: 'L0161', desc: "Expression translators", domains: ["hide"]},
  {id: 20, name: 'L0162', desc: "Walking routes", domains: ["hide"]},
  {id: 21, name: 'L0163', desc: "Code editors", domains: ["hide"]},
  {id: 22, name: 'L0164', desc: "Code generators", domains: ["hide"]},
  {id: 23, name: 'L0165', desc: "Spreadsheet questions, v2", domains: ["graffiticode"]},
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function selectLanguages() {
  const domain = getTitle().toLowerCase();
  return languages.filter(language =>
    domain === "graffiticode" && !language.domains.includes("hide") ||
      language.domains.length === 0 ||
      language.domains.includes(domain.toLowerCase())
  );
}

export default function LanguageSelector({ domain, language, setLanguage }) {
  domain = domain.toLowerCase();
  const [query, setQuery] = useState('')
  const domainLanguages =
        languages.filter(language =>
          !language.domains.includes("hide") ||
            language.domains.length === 0 ||
            language.domains.includes(domain.toLowerCase())
        );
  // Check if query is a valid custom language format (e.g., "L0177")
  const isCustomLanguage = query && /^L\d+$/i.test(query) &&
    !domainLanguages.some(lang => lang.name.toLowerCase() === query.toLowerCase());

  // For custom languages, we want to still show all domain languages in the dropdown
  // When no query is entered, show all domain languages
  // When a query is entered, filter domain languages that match the query
  const filteredLanguages =
        query === ""
          ? domainLanguages
          : domainLanguages.filter(language =>
              language.name.toLowerCase().includes(query.toLowerCase())
            );
  return (
    <Combobox as="div" value={language} onChange={setLanguage}>
      <div className="relative">
        <Combobox.Input
          className="w-full rounded-none border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm"
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(language) => language?.name}
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-none px-2 focus:outline-none">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Combobox.Button>

        {(filteredLanguages.length > 0 || isCustomLanguage) && (
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-none bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {isCustomLanguage && (
              <Combobox.Option
                key="custom"
                value={{ id: 'custom', name: query.toUpperCase(), desc: "Custom language" }}
                className={({ active }) =>
                  classNames(
                    'relative cursor-default select-none py-2 pl-8 pr-4',
                    active ? 'bg-gray-600 text-white' : 'text-gray-900'
                  )
                }
              >
                {({ active, selected }) => (
                  <>
                    <span className={classNames('block truncate', selected && 'font-semibold')}>
                      {query.toUpperCase()} (Custom)
                    </span>
                    {selected && (
                      <span
                        className={classNames(
                          'absolute inset-y-0 left-0 flex items-center pl-1.5',
                          active ? 'text-white' : 'text-gray-600'
                        )}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Combobox.Option>
            )}
            {filteredLanguages.map((language) => (
              <Combobox.Option
                key={language.id}
                value={language}
                className={({ active }) =>
                  classNames(
                    'relative cursor-default select-none py-2 pl-8 pr-4',
                    active ? 'bg-gray-600 text-white' : 'text-gray-900'
                  )
                }
              >
                {({ active, selected }) => (
                  <>
                    <span className={classNames('block truncate', selected && 'font-semibold')}>{language.name}</span>

                    {selected && (
                      <span
                        className={classNames(
                          'absolute inset-y-0 left-0 flex items-center pl-1.5',
                          active ? 'text-white' : 'text-gray-600'
                        )}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  )
}
