import NextAuth, { DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserFromDb } from "./lib/db-utils";
import { signInCredNProvider } from "./action/authenication";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id?: string;
      // GST Company Profile fields
      companyName?: string | null;
      companyAddress?: string | null;
      gstNo?: string | null;
      state?: string | null;
      stateCode?: number | null;
      bankName?: string | null;
      bankAccountNo?: string | null;
      bankBranch?: string | null;
      bankIfscCode?: string | null;
      // Local Company Profile fields
      localCompanyName?: string | null;
      localAddress?: string | null;
      localTagLine?: string | null;
      contactNo?: string | null;
      additionalContactNo?: string | null;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({

  providers: [
    Google,
    CredentialsProvider({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        let user = null;

        user = await getUserFromDb(
          credentials.email as string,
          credentials.password as string
        );

        // const rs = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        //   method: "POST",
        //   body: JSON.stringify(credentials),
        // });
        // const data = await rs.json();
        // user = data.user;

        if (!user) {
          return null;
        }
        return user;
      },
    }),
  ],

  callbacks: {
    signIn: async ({ account, profile }) => {
      if (account?.provider === "google") {
        if (!profile?.email) return false;
        signInCredNProvider(
          {
            email: profile.email as string,
            username: profile.name as string,
            image: (profile.image as string) || "",
          },
          "google"
        );
        return true;
      }
      return true;
      // return false;
    },

    async session({ session, token }) {
      if (session?.user) {
        const user = await getUserFromDb(session.user.email as string);

        if (user && typeof token.sub === "string") {
          session.user.id = user.id || token.sub;
          // GST Company Profile fields
          session.user.companyName = user.companyName || null;
          session.user.companyAddress = user.companyAddress || null;
          session.user.gstNo = user.gstNo || null;
          session.user.state = user.state || null;
          session.user.stateCode = user.stateCode || null;
          session.user.bankName = user.bankName || null;
          session.user.bankAccountNo = user.bankAccountNo || null;
          session.user.bankBranch = user.bankBranch || null;
          session.user.bankIfscCode = user.bankIfscCode || null;
          // Local Company Profile fields
          session.user.localCompanyName = user.localCompanyName || null;
          session.user.localAddress = user.localAddress || null;
          session.user.localTagLine = user.localTagLine || null;
          session.user.contactNo = user.contactNo || null;
          session.user.additionalContactNo = user.additionalContactNo || null;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },

  session: {
    strategy: "jwt",
  },
});
