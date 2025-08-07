"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";

export function SettingsAppearance() {
  const { setTheme, theme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme as string);

  const handleThemeChange = (newTheme: string) => {
    setSelectedTheme(newTheme);
  };

  const handleUpdatePreferences = () => {
    setTheme(selectedTheme);
    selectedTheme === "light"
      ? toast.success("Preferences updated to light mode!")
      : toast.success("Preferences updated to dark mode!");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Appearance</h2>
      <p className="text-muted-foreground">
        Customize the look and feel of your dashboard.
      </p>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Select the theme for the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <Card
              className={`flex flex-col items-center cursor-pointer rounded-lg border-2 p-4 w-full sm:w-1/2 transition-all duration-200 ${
                selectedTheme === "light" ? "border-primary" : "border-border"
              }`}
              onClick={() => handleThemeChange("light")}
            >
              <CardContent className="w-full rounded-md border bg-white p-3 shadow-sm space-y-2">
                <div className="h-3 rounded-lg bg-gray-300 w-full sm:w-[80%]" />
                <div className="h-3 rounded-lg bg-gray-300 w-full sm:w-[90%]" />
                <div className="h-3 rounded-lg bg-gray-300 w-full sm:w-[85%]" />
                <div className="h-3 rounded-lg bg-gray-300 w-full sm:w-[95%]" />
              </CardContent>
              <span className="mt-2 text-sm font-medium">Light</span>
            </Card>

            <Card
              className={`flex flex-col items-center cursor-pointer rounded-lg border-2 p-4 w-full sm:w-1/2 transition-all duration-200 ${
                selectedTheme === "dark" ? "border-primary" : "border-border"
              }`}
              onClick={() => handleThemeChange("dark")}
            >
              <CardContent className="w-full rounded-lg border bg-slate-950 p-3 shadow-sm space-y-2">
                <div className="h-3 rounded-lg bg-gray-800 w-full sm:w-[80%]" />
                <div className="h-3 rounded-lg bg-gray-800 w-full sm:w-[90%]" />
                <div className="h-3 rounded-lg bg-gray-800 w-full sm:w-[85%]" />
                <div className="h-3 rounded-lg bg-gray-800 w-full sm:w-[95%]" />
              </CardContent>
              <span className="mt-2 text-sm font-medium">Dark</span>
            </Card>
          </div>
          <Button
            className="w-full sm:w-auto mt-4"
            onClick={handleUpdatePreferences}
          >
            Update preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
