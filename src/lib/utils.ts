export function getTitle() {
  const hostnameParts = typeof document === "undefined" && ["Graffiticode"] || document.location.hostname.split(/[.]/g);
  const title = hostnameParts.length === 1 && hostnameParts[0] || hostnameParts[hostnameParts.length - 2];
  switch (title) {
  case "graffiticode":
    return "Graffiticode";
  case "graffiticode":
    return "Graffiticode";
  case "questioncompiler":
    return "QuestionCompiler";
  case "graffiticode":
    return "Graffiticode";
  case "hikingxxx":
    return "HikingXXX";
  default:
    return "Graffiticode";
  }
}
