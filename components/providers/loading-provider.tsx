"use client";
import { ProgressProvider } from "@bprogress/next/app";
import { createContext, useContext, useState } from "react";

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  // We'll use a ref to store the ProgressProvider's imperative API if available in the future

  // Optionally, you could trigger a custom event or use a ref to ProgressProvider if it exposes an API
  // For now, ProgressProvider will show for route/api, and you can use isLoading for custom UI or to trigger a re-render

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      <ProgressProvider
        height="4px"
        // color="#127dc4"
        color="#05c7a7"
        options={{ showSpinner: false }}
        shallowRouting
      >
        {children}
      </ProgressProvider>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within a LoadingProvider");
  return ctx;
}
