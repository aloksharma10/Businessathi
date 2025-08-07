"use client";

import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "./back-btn";
import { Profile } from "./profile";
import { BreadCrumbURLPath } from "./breadcrumb-url-path";

export function SiteHeader() {
  const { isMobile } = useSidebar();

  // Get user initials for avatar fallback
  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-[var(--header-height)] shrink-0 items-center gap-2 rounded-t-xl border-b backdrop-blur transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 py-[2px] lg:gap-2">
        {isMobile && <SidebarTrigger className="-ml-1" />}
        {!isMobile && (
          <BackButton showLabel={false} className="w-min border-accent" />
        )}

        {/* <LorrigoLogo /> */}
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <BreadCrumbURLPath />

        <div className="ml-auto flex items-center gap-4">
          {/* Search input for larger screens */}
          {/* <Input
            type="search"
            placeholder="Search..."
            className="mr-2 hidden w-72 placeholder:text-sm placeholder:text-gray-500 placeholder:text-opacity-50 lg:block"
          /> */}

          {/* Search icon for small screens */}
          {/* <Button variant="ghost" size="icon" className="lg:hidden">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button> */}

          {/* User Profile Avatar Dropdown */}
          <Profile />
          {/* {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                    <AvatarFallback className="text-xs font-medium">{getUserInitials(session.user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-muted-foreground text-xs leading-none">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )} */}
        </div>
      </div>
    </header>
  );
}
