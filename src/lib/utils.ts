export function getTitle() {
  if (typeof document === "undefined") {
    return "graffiticode";
  }

  let hostname = document.location.hostname;

  // Handle localhost as graffiticode (default)
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "graffiticode";
  }

  // Strip common prefixes
  hostname = hostname.replace(/^(console|www)\./, '');

  // Strip TLD suffixes
  hostname = hostname.replace(/\.(com|org|net|io|dev|app|co)$/, '');

  return hostname || "graffiticode";
}
