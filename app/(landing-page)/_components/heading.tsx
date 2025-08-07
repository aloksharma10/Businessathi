import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChartNoAxesCombined,
  CloudUpload,
  FileText,
  Shield,
} from "lucide-react";
import Link from "next/link";

export const Heading = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-12 h-full pt-32 text-gray-800 dark:text-white text-center">
      <div className="text-5xl lg:text-6xl font-bold text-center w-full">
        Simplify Your Business with
        <div className="lg:pt-4">
          <span className="text-blue-600 dark:text-[#5c7cfa]">Business</span>
          Sathi
        </div>
      </div>
      <p className="text-2xl text-muted-foreground">
        Manage inventory, create GST & non-GST bills, and export your data—all
        in one place.
      </p>

      <div className="py-6">
        <Link href={"/auth/signin"}>
          <Button className="font-semibold px-8 py-6 text-lg text-white bg-blue-600 dark:bg-[#4c6ef5] hover:bg-blue-700 dark:hover:bg-[#3b5bdb] flex items-center">
            Get started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="py-28 px-2">
        <h2 className="text-4xl font-bold mb-14 ">How We Help You</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="text-center bg-muted rounded-lg p-12 shadow-lg">
            <div className="bg-secondary-foreground w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Automated Processing
            </h3>
            <p className="text-gray-600 dark:text-[#adb5bd]">
              Generate and process invoices instantly, saving time and reducing
              errors.
            </p>
          </div>
          <div className="text-center bg-muted rounded-lg p-12 shadow-lg">
            <div className="bg-secondary-foreground w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
              <ChartNoAxesCombined className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Real-time Analytics
            </h3>
            <p className="text-gray-600 dark:text-[#adb5bd]">
              Track cash flow, expenses, and sales trends to make smarter
              business decisions.
            </p>
          </div>
          <div className="text-center bg-muted rounded-lg p-12 shadow-lg">
            <div className="bg-secondary-foreground w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Secure Platform
            </h3>
            <p className="text-gray-600 dark:text-[#adb5bd]">
              Bank-level security to keep your financial data safe and
              accessible only to you.
            </p>
          </div>
          <div className="text-center bg-muted rounded-lg p-12 shadow-lg">
            <div className="bg-secondary-foreground w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
              <CloudUpload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Seamless Data Export
            </h3>
            <p className="text-gray-600 dark:text-[#adb5bd]">
              Export your data anytime in PDF, CSV, or XLSX formats.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
