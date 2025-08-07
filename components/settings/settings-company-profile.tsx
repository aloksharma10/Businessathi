"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { CompanyProfileForm } from "../company-profile-form";
import { useSession } from "next-auth/react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

export default function SettingsCompanyProfile() {
  const { data: session } = useSession();
  const user = session?.user;

  const hasGSTProfile = user?.companyName || user?.gstNo;
  const hasLocalProfile = user?.localCompanyName || user?.localAddress;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Company Profile</h2>
        <p className="text-muted-foreground">
          Set up your company profile to enable smooth invoicing.
        </p>
      </div>

      {/* Display Current Profile Information */}
      {(hasGSTProfile || hasLocalProfile) && (
        <Card>
          <CardHeader>
            <CardTitle>Current Company Profile</CardTitle>
            <CardDescription>
              Your current company profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {hasGSTProfile && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="default">GST Company</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user?.companyName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Company Name
                      </p>
                      <p className="text-sm">{user.companyName}</p>
                    </div>
                  )}
                  {user?.gstNo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        GST Number
                      </p>
                      <p className="text-sm">{user.gstNo}</p>
                    </div>
                  )}
                  {user?.companyAddress && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Address
                      </p>
                      <p className="text-sm">{user.companyAddress}</p>
                    </div>
                  )}
                  {user?.state && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        State
                      </p>
                      <p className="text-sm">
                        {user.state} ({user.stateCode})
                      </p>
                    </div>
                  )}
                  {user?.bankName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Bank
                      </p>
                      <p className="text-sm">
                        {user.bankName} - {user.bankBranch}
                      </p>
                    </div>
                  )}
                  {user?.bankAccountNo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Account Number
                      </p>
                      <p className="text-sm">{user.bankAccountNo}</p>
                    </div>
                  )}
                  {user?.bankIfscCode && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        IFSC Code
                      </p>
                      <p className="text-sm">{user.bankIfscCode}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasLocalProfile && (
              <div>
                {hasGSTProfile && <Separator className="my-4" />}
                <div className="flex items-center gap-2 mb-3">
                  <Badge>Local Company</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user?.localCompanyName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Company Name
                      </p>
                      <p className="text-sm">{user.localCompanyName}</p>
                    </div>
                  )}
                  {user?.localAddress && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Address
                      </p>
                      <p className="text-sm">{user.localAddress}</p>
                    </div>
                  )}
                  {user?.localTagLine && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Tag Line
                      </p>
                      <p className="text-sm">{user.localTagLine}</p>
                    </div>
                  )}
                  {user?.contactNo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Contact No
                      </p>
                      <p className="text-sm">
                        {user.contactNo}{" "}
                        {user.additionalContactNo &&
                          `, ${user.additionalContactNo}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update Company Profile</CardTitle>
          <CardDescription>
            Add or update your company profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <CompanyProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
