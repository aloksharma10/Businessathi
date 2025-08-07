import { ReactNode } from "react";
import { Navbar } from "./_components/navbar";
import { Footer } from "./_components/footer";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center min-h-screen container mx-auto">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center w-full py-16 px-5">
        {children}
      </main>
      <Footer />
    </div>
  );
}
