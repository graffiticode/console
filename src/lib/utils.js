export function getTitle() {
  const hostnameParts = typeof document === "undefined" && ["Artcompiler"] || document.location.hostname.split(/[.]/g);
  const title = hostnameParts.length === 1 && hostnameParts[0] || hostnameParts[hostnameParts.length - 2];
  switch (title) {
  case "artcompiler":
    return "Artcompiler";
  case "graffiticode":
    return "Artcompiler";
  case "questioncompiler":
    return "QuestionCompiler";
  case "chartcompiler":
    return "ChartCompiler";
  case "hikingxxx":
    return "HikingXXX";
  default:
    return "Artcompiler";
  }
}
