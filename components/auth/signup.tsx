"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signInCredNProvider, signInWGoogle } from "@/action/authenication";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function Signup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const handleSubmit = async (formData: FormData) => {
    try {
      const user = await signInCredNProvider(
        {
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          username: formData.get("username") as string,
        },
        "cred"
      );
      if (user) {
        router.push("/auth/signin");
      }
    } catch (error) {
      console.error(error, "[handleSubmit]");
    }
  };
  return (
    <div className={cn("flex flex-col gap-6 w-full", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <form action={signInWGoogle}>
                <Button variant="outline" className="w-full">
                  <Image
                    src={"/google.svg"}
                    alt="google"
                    width={10}
                    height={10}
                    className="mr-2 w-5 h-5"
                  />
                  Login with Google
                </Button>
              </form>
            </div>
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
            <form action={handleSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="username"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Signup
                </Button>
              </div>
              <div className="text-center text-sm pt-5">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="underline underline-offset-4"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
