"use server";

import { signIn } from "@/auth";
import prisma from "@/lib/db";
import { saltAndHashPassword } from "@/lib/db-utils";

type AuthCredentials = {
  email: string;
  password?: string;
  username?: string;
  image?: string;
};

export const signInWGoogle = async () => {
  await signIn("google");
};

async function signInProvider(profile: {
  email: string;
  name: string;
  image: string;
}) {
  await prisma.users.create({
    data: {
      username: profile.name || "",
      email: profile.email,
      image: (profile.image as string) || "",
    },
  });
}

export async function signInCredNProvider(
  { email, password, username }: AuthCredentials,
  type: string
) {
  if (!email) {
    return { valid: false, error: "Please provide email and password" };
  }

  if (username && type === "cred") {
    await signInCred({ email, password, username });
    return true;
  }
  if (!username && type === "cred") {
    await signInCred({ email, password });
    return true;
  }

  if (type === "google") {
    const user = await prisma.users.findFirst({
      where: {
        email,
      },
    });

    if (user) {
      return { valid: false, error: "User already exist" };
    }

    await signInProvider({
      email,
      name: username || "",
      image: "",
    });
    return true;
  }
}

export async function signInCred(formData: AuthCredentials) {
  const { email, password, username } = formData;

  if (!email || !password) {
    return { error: "Please provide email and password" };
  }
  if (username) {
    const user = await prisma.users.findFirst({
      where: {
        email,
      },
    });
    if (user) {
      return { error: "User already exist" };
    }
    const hashPassword = await saltAndHashPassword(password as string);
    if (!hashPassword) {
      return { error: "Error hashing password" };
    }
    if (hashPassword) {
      await prisma.users.create({
        data: {
          email,
          password: hashPassword,
          username,
        },
      });
    }
    return true;
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return true;
  } catch (error) {
    console.error(error, "[signIn]");
    return { error: "Invalid credentials" };
  }
}
