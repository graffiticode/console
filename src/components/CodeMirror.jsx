import useCodeMirror from "../utils/cm/use-codemirror";

const CodeMirror = (args) => {
  //console.log("CodeMirror() args=" + JSON.stringify(args, null, 2));
  const extensions = args.extensions;
  const { ref } = useCodeMirror(extensions);

  return <div ref={ref} />;
};

export default CodeMirror;
