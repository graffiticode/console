import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyAccessToken } from "../../../lib/auth";

export default async function auth(req, res) {
  const providers = [];

  const isDefaultSigninPage =
    req.method === "GET" && req.query.nextauth.includes("signin");
  if (!isDefaultSigninPage) {
    providers.push(CredentialsProvider({
      id: "graffiticode-ethereum",
      name: "Graffiticode Ethereum",
      credentials: {
        accessToken: {
          label: "Access Token",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials) {
        const accessToken = credentials?.accessToken;
        if (!accessToken) {
          return null;
        }
        try {
          const { sub: id } = await verifyAccessToken({ accessToken });
          return { id, accessToken };
        } catch (error) {
          console.error(error);
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
      async jwt({ token, account, user }) {
        if (account?.provider === "graffiticode-ethereum") {
          token.accessToken = user.accessToken;
        }
        return token;
      },
      async session({ session, token }) {
        session.address = token.sub;
        session.accessToken = token.accessToken;
        session.user.name = token.sub;
        return session;
      },
    },
  });
}
