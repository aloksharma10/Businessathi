"use client";

import { useEffect, useState } from "react";
import { EditLocalInvoiceModal } from "../modal/edit-local-invoice-modal";
import { DeleteLocalCustomerModal } from "../modal/local-customer-modal/delete-local-customer-modal";
import { DeleteCustomerModal } from "../modal/gst-customer-modal/delete-customer-modal";
import { DeleteLocalProductModal } from "../modal/local-product-modal/delete-local-product-modal";
import { DeleteProductModal } from "../modal/gst-product-modal/delete-product-modal";
import { CompanyProfileModal } from "../modal/company-profile-modal";
import { GSTSubmitModal } from "../modal/gst-submit-modal";
import { CreateCustomerModal } from "../modal/gst-customer-modal/create-customer-modal";
import { EditCustomerModal } from "../modal/gst-customer-modal/edit-customer-model";
import { CreateProductModal } from "../modal/gst-product-modal/create-product-modal";
import { EditProductModal } from "../modal/gst-product-modal/edit-product-modal";
import { CreateLocalProductModal } from "../modal/local-product-modal/create-local-product-modal";
import { EditLocalProductModal } from "../modal/local-product-modal/edit-local-product-modal";
import { CreateLocalCustomerModal } from "../modal/local-customer-modal/create-local-customer-modal";
import { EditLocalCustomerModal } from "../modal/local-customer-modal/edit-local-customer-modal";
import { TitanSubmitModal } from "../modal/titan-submit-modal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <CreateCustomerModal />
      <EditCustomerModal />
      <DeleteCustomerModal />

      <CreateProductModal />
      <EditProductModal />
      <DeleteProductModal />

      <CreateLocalCustomerModal />
      <EditLocalCustomerModal />
      <DeleteLocalCustomerModal />

      <CreateLocalProductModal />
      <EditLocalProductModal />
      <DeleteLocalProductModal />
      
      <EditLocalInvoiceModal />

      <CompanyProfileModal />

      <GSTSubmitModal />
      <TitanSubmitModal />
    </>
  );
};
