import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export const SessionWrapper = async ({ children }: { children: ReactNode }) => {
  const session = await auth();
  return <SessionProvider session={session}>{children}</SessionProvider>
};
