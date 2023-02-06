export function isNonEmptyString(str) {
  return (typeof (str) === "string" && str.length > 0);
}

export function isNonNullObject(obj) {
  return (typeof obj === "object" && obj !== null);
}
