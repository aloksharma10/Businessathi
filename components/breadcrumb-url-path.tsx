"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

export const BreadCrumbURLPath = () => {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {paths.map((path, index) => {
          const href = `/${paths.slice(1, index).join("/")}`;
          const isLast = index === paths.length - 1;
          return (
            <Fragment key={path}>
              <BreadcrumbItem key={path}>
                {isLast ? (
                  <BreadcrumbPage className="capitalize font-medium">
                    {path}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href} className="capitalize font-medium">
                    {path}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
