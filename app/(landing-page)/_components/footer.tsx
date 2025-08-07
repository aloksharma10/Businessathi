import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export const Footer = () => {
  return (
    <div className="md:flex items-center justify-between text-center w-full py-5 border-t">
      <div>
        <Link
          href={"/"}
          className="flex items-center justify-center text-xl lg:text-3xl font-semibold text-blue-600 dark:text-[#5c7cfa]"
        >
          <Image
            src={"/Logo.png"}
            alt="Logo"
            width={25}
            height={25}
            className="w-7 h-7 lg:w-auto lg:h-auto"
          />
          Business<span className="text-secondary">Sathi</span>
        </Link>
      </div>
      <div className="mt-2">
        <Link href="/privacy-policy">
          <Button
            variant={"link"}
            className="text-gray-600 dark:text-white text-xs lg:text-base px-[6px] "
          >
            Privacy Policy
          </Button>
        </Link>
        <Link href="/terms-and-conditions">
          <Button
            variant={"link"}
            className="text-gray-600 dark:text-white text-xs lg:text-base px-[6px] "
          >
            Terms & Conditions
          </Button>
        </Link>
      </div>
    </div>
  );
};
