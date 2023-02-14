import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { exchangeRefreshToken, verifyAccessToken } from "../../../lib/auth";


const verifyAndRefreshAccessToken = async ({ refreshToken, accessToken }) => {
  try {
    await verifyAccessToken({ accessToken });
    return accessToken;
  } catch (err) {
    if (err.code === "ERR_JWT_EXPIRED") {
      const accessToken = await exchangeRefreshToken({ refreshToken });
      return accessToken;
    }
    throw err;
  }
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "graffiticode-ethereum",
      name: "Graffiticode Ethereum",
      credentials: {
        accessToken: {
          label: "Refresh Token",
          type: "text",
          placeholder: "0x0",
        },
        accessToken: {
          label: "Access Token",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials) {
        const refreshToken = credentials?.refreshToken;
        const accessToken = credentials?.accessToken;
        if (!accessToken) {
          return null;
        }
        try {
          const { sub: id } = await verifyAccessToken({ accessToken });
          return { id, refreshToken, accessToken };
        } catch (error) {
          console.error(error);
          return null;
        }
      },
    })
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXT_AUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === "graffiticode-ethereum") {
        token.refreshToken = user.refreshToken;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      let { refreshToken, accessToken } = token;
      accessToken = await verifyAndRefreshAccessToken({ refreshToken, accessToken });

      session.address = token.sub;
      session.refreshToken = refreshToken;
      session.accessToken = accessToken;
      session.user.name = token.sub;
      return session;
    },
  },
};

export default NextAuth(authOptions);
