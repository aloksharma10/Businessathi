"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export const CreateCompanyProfile = async (values: any, userId: string) => {
  try {
    const updateData: any = {};

    if (values.companyType === "gst") {
      // Update GST company profile fields
      updateData.companyName = values.companyName;
      updateData.companyAddress = values.companyAddress;
      updateData.gstNo = values.gstNo;
      updateData.state = values.state;
      updateData.stateCode = Number(values.stateCode);
      updateData.bankName = values.bankName;
      updateData.bankAccountNo = values.bankAccountNo;
      updateData.bankBranch = values.bankBranch;
      updateData.bankIfscCode = values.bankIfscCode;
    } else if (values.companyType === "local") {
      // Update local company profile fields
      updateData.localCompanyName = values.localCompanyName;
      updateData.localAddress = values.localAddress;
      updateData.localTagLine = values.localTagLine;
      updateData.contactNo = values.contactNo;
      updateData.additionalContactNo = values.additionalContactNo;
    }

    const newCompanyProfile = await prisma.users.update({
      where: {
        id: userId,
      },
      data: updateData,
    });

    revalidatePath("/");
    return newCompanyProfile;
  } catch (error) {
    console.log(error, "[CreateCompanyProfile]");
    throw error;
  }
};
