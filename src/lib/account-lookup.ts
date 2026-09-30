// Finding an account to share with.

// The form of a profile name that lookups match on: trimmed, lowercased, runs
// of whitespace collapsed to one space. Stored as users/{uid}.nameLower
// wherever `name` is written.
export const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();
