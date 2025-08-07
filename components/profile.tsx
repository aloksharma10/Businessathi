"use client";

import { SignoutBtn } from "./signout-btn";
import { Separator } from "./ui/separator";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Settings } from "lucide-react";

export const Profile = () => {
  const session = useSession();

  const user = {
    name: session?.data?.user?.name || "",
    email: session?.data?.user?.email || "",
    image: session?.data?.user?.image || "/",
  };

  return (
    <div className="flex items-center gap-2">
      <Separator
        orientation="vertical"
        className="lg:h-5 lg:font-bold lg:bg-black"
      />
      <DropdownMenu>
        <DropdownMenuTrigger className="hover:bg-gray-400/50 p-[6px] rounded-full transition-all duration-200 ease-in-out focus-visible:outline-none">
          <Image
            alt="User Avatar"
            src={user.image || ""}
            width={30}
            height={30}
            className="rounded-full"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <div className="flex items-center flex-col py-6 bg-gray-100 dark:bg-gray-800 rounded-md m-[6px]">
            <Image
              alt="User Avatar"
              src={user.image || ""}
              width={60}
              height={60}
              className="rounded-full"
            />
            <h2 className="capitalize font-semibold pt-1">{user.name}</h2>
            <p className="text-sm text-foreground">{user.email}</p>
          </div>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/settings">
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
          </Link>
          {/* <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Team</DropdownMenuItem> */}
          <DropdownMenuSeparator />
          <SignoutBtn />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
