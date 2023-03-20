import useSWR from "swr";
import { loadGraphiQL } from '../utils/swr/fetchers';
import { CheckIcon, HandThumbUpIcon, UserIcon } from '@heroicons/react/20/solid'
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import React from 'react';
import ReactDOM from 'react-dom';
import { request } from 'graphql-request';



function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

// import 'graphiql/graphiql.css';

// const fetcher = createGraphiQLFetcher({
//   url: 'http://localhost:3000/api/graphql',
//   fetch: request,
// });

export default function graphiql() {
  //const { user } = useGraffiticodeAuth();
  return <div />;
}
