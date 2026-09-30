// Finding an account to share with (a connection or an item). The owner types
// a verified linked email, an exact profile name, or an account ID; each finds
// accounts by exact match only, so the lookup can't be used to list users. A
// match carries the account ID and a display name — never an email or any
// other profile field. The query itself is never logged, only counts.
import { getFirestore } from "../utils/db";
import { accountExists, accountForEmail, isAccountId, isEmail, normalizeAccountId } from "./connection-sharing";

// The form of a profile name that lookups match on: trimmed, lowercased, runs
// of whitespace collapsed to one space. Stored as users/{uid}.nameLower
// wherever `name` is written.
export const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

export const MIN_QUERY_LENGTH = 3;
export const MAX_MATCHES = 10;

export type MatchedBy = "email" | "name" | "id";

export type AccountMatch = {
  accountId: string;
  name: string;
  shortId: string;
  matchedBy: MatchedBy;
};

// A short, recognizable form of an account ID: first six and last four.
export const shortAccountId = (accountId: string) => {
  const id = normalizeAccountId(accountId);
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
};

// Accounts no one shares with: the eval harness and the shared trial account.
const systemUids = () => new Set([process.env.EVAL_UID, process.env.FREE_PLAN_UID].filter(Boolean) as string[]);
export const isSystemAccount = (uid: string) => systemUids().has(uid);

// The account's profile name, if it has one.
export async function profileName(uid: string): Promise<string | null> {
  const doc = await getFirestore().collection("users").doc(uid).get();
  const name = doc.exists ? doc.data()?.name : null;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

async function toMatch(uid: string, matchedBy: MatchedBy, name?: unknown): Promise<AccountMatch> {
  const known = typeof name === "string" && name.trim() ? name.trim() : await profileName(uid);
  return { accountId: uid, name: known || shortAccountId(uid), shortId: shortAccountId(uid), matchedBy };
}

export async function findAccounts(callerUid: string, rawQuery: string): Promise<AccountMatch[]> {
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  if (query.length < MIN_QUERY_LENGTH) return [];
  const excluded = systemUids();
  excluded.add(callerUid);
  const allowed = (uid: string | null): uid is string => !!uid && !excluded.has(uid);

  let kind: MatchedBy;
  let matches: AccountMatch[];
  if (isAccountId(query)) {
    kind = "id";
    const uid = normalizeAccountId(query);
    matches = allowed(uid) && (await accountExists(uid)) ? [await toMatch(uid, "id")] : [];
  } else if (isEmail(query)) {
    kind = "email";
    const uid = await accountForEmail(query);
    matches = allowed(uid) ? [await toMatch(uid, "email")] : [];
  } else {
    kind = "name";
    // Over-fetch by the number of excluded accounts so the cap still holds
    // after they are filtered out.
    const snap = await getFirestore()
      .collection("users")
      .where("nameLower", "==", normalizeName(query))
      .limit(MAX_MATCHES + excluded.size)
      .get();
    matches = await Promise.all(
      snap.docs
        .filter(doc => allowed(doc.id))
        .slice(0, MAX_MATCHES)
        .map(doc => toMatch(doc.id, "name", doc.data()?.name)),
    );
  }
  console.log(`[findAccounts] kind=${kind} matches=${matches.length}`);
  return matches;
}
