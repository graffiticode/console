export function getTitle() {
  const hostnameParts = document.location.hostname.split(/[.]/g);
  console.log("Layout() hostnameParts=" + JSON.stringify(hostnameParts));
  const title = hostnameParts.length === 1 && hostnameParts[0] || hostnameParts[hostnameParts.length - 2];
  console.log("getTitle() title=" + title);
  switch (title) {
  case "questioncompiler":
    return "QuestionCompiler";
  case "graffiticode":
  default:
    return "Graffiticode";
  }
}
