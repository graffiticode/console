export function getTitle() {
  const hostnameParts = typeof document === "undefined" && ["Graffiticode"] || document.location.hostname.split(/[.]/g);
  const title = hostnameParts.length === 1 && hostnameParts[0] || hostnameParts[hostnameParts.length - 2];
  console.log("getTitle() title=" + title)
  switch (title) {
  case "questioncompiler":
    return "QuestionCompiler";
  case "chartcompiler":
    return "ChartCompiler";
  case "hikingxxx":
    return "HikingX";
  case "graffiticode":
  default:
    return "Graffiticode";
  }
}
