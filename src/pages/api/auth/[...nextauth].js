import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";
import { exchangeEthereum, getUserNonce } from "../../../lib/auth";

export default async function auth(req, res) {
  const providers = [];

  const isDefaultSigninPage =
    req.method === "GET" && req.query.nextauth.includes("signin");
  if (!isDefaultSigninPage) {
    providers.push(CredentialsProvider({
      name: "Graffiticode Ethereum",
      credentials: {
        message: {
          label: "Message",
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
        try {
          const siwe = new SiweMessage(JSON.parse(credentials?.message || "{}"));
          console.log({ address: siwe.address, signature: credentials?.signature });
          await exchangeEthereum({ address: siwe.address, signature: credentials?.signature });
          return {
            id: siwe.address,
          }
        } catch (e) {
          return null
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
        console.log(token);
        session.address = token.sub
        session.user.name = token.sub
        return session
      },
    },
  });
}
