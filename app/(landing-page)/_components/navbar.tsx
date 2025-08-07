import Image from "next/image";
import Link from "next/link";
import { SimpleThemeToggle } from "@/components/mode-toggle";

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-5 md:px-16 py-3 lg:py-5 md:rounded-b-4xl w-full backdrop-blur-md border-b">
      <div>
        <Link
          href={"/"}
          className="flex items-center text-2xl lg:text-4xl font-semibold text-blue-600 dark:text-[#5c7cfa]"
        >
          <Image
            src={"/Logo.png"}
            alt="Logo"
            width={40}
            height={40}
            className="hidden lg:block"
          />
          <Image
            src={"/Logo.png"}
            alt="Logo"
            width={30}
            height={30}
            className="block lg:hidden"
          />
          Business<span className="text-secondary">Sathi</span>
        </Link>
      </div>
      <SimpleThemeToggle />
    </nav>
  );
};
