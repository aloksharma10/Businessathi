"use client";

import { Customer, LocalCustomer, LocalProduct, Product, LocalInvoice } from "@prisma/client";
import { create } from "zustand";

export type ModalType =
  | "createCustomer"
  | "editCustomer"
  | "deleteCustomer"
  | "createProduct"
  | "editProduct"
  | "deleteProduct"
  | "createLocalCustomer"
  | "editLocalCustomer"
  | "deleteLocalCustomer"
  | "createLocalProduct"
  | "editLocalProduct"
  | "deleteLocalProduct"
  | "editLocalInvoice"
  | "gstSubmit"
  | "titanCompanySubmit"
  | "companyProfile";

interface ModalData {
  customer?: Customer;
  localCustomer?: LocalCustomer;
  product?: Product;
  localProduct?: LocalProduct;
  localInvoice?: LocalInvoice;
  xlsxDataForGST?: any[];
  xlsxDataForTitan?: any[];
}

interface ModalStore {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
  // Data refresh mechanism
  refreshCallbacks: Map<string, () => void>;
  registerRefreshCallback: (key: string, callback: () => void) => void;
  unregisterRefreshCallback: (key: string) => void;
  triggerRefresh: (key: string) => void;
  triggerAllRefresh: () => void;
}

export const useModal = create<ModalStore>((set, get) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
  // Data refresh mechanism
  refreshCallbacks: new Map(),
  registerRefreshCallback: (key, callback) => {
    const { refreshCallbacks } = get();
    refreshCallbacks.set(key, callback);
    set({ refreshCallbacks: new Map(refreshCallbacks) });
  },
  unregisterRefreshCallback: (key) => {
    const { refreshCallbacks } = get();
    refreshCallbacks.delete(key);
    set({ refreshCallbacks: new Map(refreshCallbacks) });
  },
  triggerRefresh: (key) => {
    const { refreshCallbacks } = get();
    const callback = refreshCallbacks.get(key);
    if (callback) {
      callback();
    }
  },
  triggerAllRefresh: () => {
    const { refreshCallbacks } = get();
    refreshCallbacks.forEach((callback) => callback());
  },
}));
