import { stripHexPrefix } from "@ethereumjs/util";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { exchangeEthereum } from "../../../lib/auth";

export default async function auth(req, res) {
  const providers = [];

  const isDefaultSigninPage =
    req.method === "GET" && req.query.nextauth.includes("signin");
  if (!isDefaultSigninPage) {
    providers.push(CredentialsProvider({
      name: "Graffiticode Ethereum",
      credentials: {
        address: {
          label: "Address",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials) {
        const address = stripHexPrefix(credentials?.address);
        const signature = stripHexPrefix(credentials?.signature);
        try {
          await exchangeEthereum({ address, signature });
          return { id: address };
        } catch (e) {
          console.error(e);
          return null;
        }
      },
    }));
  }

  return await NextAuth(req, res, {
    providers,
    session: {
      strategy: "jwt",
    },
    secret: process.env.NEXT_AUTH_SECRET,
    callbacks: {
      async session({ session, token }) {
        session.address = token.sub;
        session.user.name = token.sub;
        return session;
      },
    },
  });
}
