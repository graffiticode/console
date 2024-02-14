/*
  TODO
  [x] Get full schema from ./public/schema.json
  [ ] Use conditionals to define value dependencies
  [ ] Put properties in the tail object value of task code ({}..)
  [ ] saveTask and refresh form with each change
  [ ] Update Props editor from state after first compile to get inits
  [ ] Update Props editor dynamically based on current values
  [ ] Validate input data using schema
*/

import React, { useState, useEffect, useRef } from 'react';
import { RadioGroup } from '@headlessui/react'
import { Switch } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { Combobox } from '@headlessui/react'
import { createState } from "../lib/state";
import { getLanguageAsset } from "../lib/api";
import useSWR from 'swr';
import { getData } from '../utils/swr/fetchers';
import FormView from "./FormView.jsx";

const stateOptions = [
  { type: 'initial', available: true },
  { type: 'resume', available: true },
  { type: 'review', available: true },
]

const validationOptions = [
  { type: 'showValidationUI', available: true },
  { type: 'resetValidationUI', available: true },
]

const checkAnswerOptions = [
  { type: 'checkAnswer', available: true },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const states = [
  { id: 1, name: 'Alabama' },
  { id: 2, name: 'Alaska' },
  { id: 3, name: 'California' },
  { id: 4, name: 'Hawaii' },
  { id: 5, name: 'Montana' },
];

const maps = [
  { id: 1, name: 'us-states' },
  { id: 2, name: 'us-counties' },
  { id: 3, name: 'world-countries' },
  { id: 4, name: 'world-continents' },
];  

const optionsFromEnum = e => e.map((name, index) => ({id: index, name}));

const fields = [{
  name: "map",
  desc: "Select the map to use",
  input: {type: "Combo", values: maps},
}, {
  name: "correctResponse",
  desc: "Enter the correct answer",
  input: {type: "Combo", values: states},
}, {
  name: "showGrid",
  desc: "Show lines of latitude and longitude",
  input: {type: "Toggle", values: [true, false]},
}];

export default function Text({ value }) {
  return (
    <div>
      <label htmlFor="email" className="sr-only">
        Text
      </label>
      <input
        type="text"
        name="text"
        id="text"
        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6"
        defaultValue={value}
      />
    </div>
  )
}

function Combo({value, options, onChange}) {
  const [query, setQuery] = useState(value);
  const [selectedOption, setSelectedOption] = useState(options[0]);
  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) => {
          return option.name.toLowerCase().includes(query.toLowerCase())
        })
  useEffect(() => {
    onChange(selectedOption.name);
  }, [selectedOption]);
  return (
    <Combobox as="div" value={selectedOption} onChange={setSelectedOption}>
      <div className="relative mt-2">
        <Combobox.Input
          className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6"
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(option) => option?.name}
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Combobox.Button>

        {filteredOptions.length > 0 && (
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredOptions.map((option) => (
              <Combobox.Option
                key={option.id}
                value={option}
                className={({ active }) =>
                  classNames(
                    'relative cursor-default select-none py-2 pl-3 pr-9',
                    active ? 'bg-gray-600 text-white' : 'text-gray-900'
                  )
                }
              >
                {({ active, selected }) => (
                  <>
                    <span className={classNames('block truncate', selected && 'font-semibold')}>{option.name}</span>

                    {selected && (
                      <span
                        className={classNames(
                          'absolute inset-y-0 right-0 flex items-center pr-4',
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

function Props({ propDefs, state }) {
  const field = [];
  const data = state.data;
  const fields = Object.keys(propDefs).map(key => {
    const propDef = propDefs[key];
    return {
      name: key,
      desc: propDef.description,
      type: propDef.type,
      input: {type: "Text", values: data[key] || ""},
    };
  });
  const handleChange = args => (console.log("handleChange() args=" + JSON.stringify(args), state.apply({type: "change", args})))
  return (
    <div className="p-2">
      <div className="px-4 py-6 font-light grid grid-cols-1 lg:grid-cols-5 text-sm">
        {
          fields.map(field => {
            const propDef = propDefs[field.name];
            const Input = field.input;
            return (
              <>
                <div className="font-mono pb-10">{field.name}</div>
                <div className="col-span-1 lg:col-span-3 text-gray-500">{field.desc}<br/><span className="font-mono p-1 rounded-md bg-gray-100 text-xs">{field.type}</span></div>
                <div className="col-span-1">
                  {
                    propDef.enum &&
                      <Combo
                        options={optionsFromEnum(propDef.enum)}
                        value={field.input.values}
                        onChange={(value) => handleChange({[field.name]: value})}
                      /> ||
                      field.input.type === "Toggle" &&
                      <Toggle type={field.name}
                              onChange={(value) => handleChange({[field.name]: value})}
                      /> ||
                      <Text value={field.input.values} />
                  }
                </div>
              </>
            );
          })
        }
      </div>
    </div>
  )
}

const people = [
  { name: 'map', description: 'Select a geographic region', value: 'US States' },
  { name: 'correctResponse', description: 'Choose the correct response', value: 'California' },
  { name: 'problem', description: 'Write a problem statement for the question', value: 'Where is ${correctResponse}?' },
  { name: 'projection', description: 'Select the map style', value: 'AlbersUsa' },
]

function Toggle({ type, disabled, enabled, onChange }) {
  const [checked, setChecked] = useState(enabled)
  useEffect(() => {
    setChecked(enabled);
  }, [enabled]);
  useEffect(() => {
    onChange(checked);
  }, [checked]);
  return (
    <Switch.Group as="div" className="flex items-center">
      <Switch
        checked={checked}
        disabled={disabled}
        onChange={setChecked}
        className={classNames(
          checked ? 'bg-gray-600' : 'bg-gray-200',
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-none border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none'
        )}
      >
        <span
          aria-hidden="true"
          className={classNames(
            checked ? 'translate-x-5' : 'translate-x-0',
            'pointer-events-none inline-block h-5 w-5 transform rounded-none bg-white shadow ring-0 transition duration-200 ease-in-out'
          )}
        />
      </Switch>
      <Switch.Label as="span" className="ml-3 text-sm">
        <span className="font-medium text-gray-900">{type}</span>{' '}
      </Switch.Label>
    </Switch.Group>
  )
}

function isNonNullNonEmptyObject(obj) {
  return (
    typeof obj === "object" &&
      obj !== null &&
      Object.keys(obj).length > 0
  );
}

/*
  With property change, update state with new property value and recompile task.

  The property editor is just another form view that results in a recompile
  with a state change. Base the code on the code in any of the modern viewers.

  Call setTaskId when a new id is gotten.

  Tasks in the task view might be a code+data pair where the data is the
  properties. The property editor gets the current value of the properties
  from the data from the current id.
 */

export const Properties = ({ id, lang, setCode, user }) => {
  const [ recompile, setRecompile ] = useState(true);
  const [ propDefs, setPropDefs ] = useState({});
  const [ height, setHeight ] = useState(0);
  useEffect(() => {
    // If `id` changes, then recompile.
    setRecompile(true);
  }, [id]);

  useEffect(() => {
    (async () => {
      const schema = await getLanguageAsset(`L${lang}`, "schema.json") || "{}";
      setPropDefs(JSON.parse(schema).properties);
    })();
  }, []);

  const [ state ] = useState(createState({}, (data, { type, args }) => {
    console.log("state.apply() type=" + type + " args=" + JSON.stringify(args, null, 2));
    switch (type) {
    case "compiled":
      return {
        ...data,
        ...args,
      };
    case "change":
      setRecompile(true);
      return {
        ...data,
        ...args,
      };
    default:
      console.error(false, `Unimplemented action type: ${type}`);
      return data;
    }
  }));

  const resp = useSWR(
    recompile && user && id && {
      user,
      id,
      data: state.data,
    },
    getData
  );

  if (resp.data) {
    state.apply({
      type: "compiled",
      args: resp.data,
    });
    setRecompile(false);
  }

  return (
    <FormView lang="0011" id={id} setCode={setCode}/>
  );
}
