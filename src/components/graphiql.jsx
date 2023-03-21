import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function GraphiQL() {
  // FIXME add auth to fetch requests.
  const { user } = useGraffiticodeAuth();
  console.log("graphiql() user=" + JSON.stringify(user, null, 2));
  return <embed src="http://localhost:3000/api" width="100%" height="100%"/>
}
