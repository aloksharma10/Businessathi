"use server";

import prisma from "@/lib/db";
import {
  endOfDay,
  format,
  startOfDay,
} from "date-fns";
import { revalidatePath } from "next/cache";

export type TankerDriverOption = {
  id: string;
  driverName: string;
  driverPhone: string;
};

export type TankerBookingRow = {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  waterLiters: number;
  amount: string;
  tankerDate: Date;
  createdAt: Date;
};

export type DriverSummaryRow = {
  driverId: string;
  driverName: string;
  driverPhone: string;
  totalWaterLiters: number;
  totalAmount: number;
  bookingCount: number;
};

function parseAmount(value: string): number {
  const n = parseFloat(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function bookingDateFilter(dateFrom?: Date, dateTo?: Date) {
  if (!dateFrom && !dateTo) return undefined;
  return {
    gte: dateFrom ? startOfDay(dateFrom) : undefined,
    lte: dateTo ? endOfDay(dateTo) : undefined,
  };
}

function normDriverName(s: string) {
  return s.trim().replace(/\s+/g, " ").toUpperCase();
}

function normDriverPhone(s: string) {
  return s.trim().replace(/\D/g, "");
}

async function findOrCreateDriver(driverName: string, driverPhone: string) {
  const name = normDriverName(driverName);
  const phone = normDriverPhone(driverPhone);
  if (!name) throw new Error("Driver name is required.");
  if (phone.length < 10) throw new Error("Enter a valid 10-digit phone number.");

  const existing = await prisma.tankerDriver.findFirst({
    where: { driverName: name, driverPhone: phone },
  });
  if (existing) return existing;

  return prisma.tankerDriver.create({
    data: { driverName: name, driverPhone: phone },
  });
}

/** Find existing driver by name + phone or create one. */
export async function ensureTankerDriver(rawName: string, rawPhone: string) {
  const driverName = normDriverName(rawName);
  const driverPhone = normDriverPhone(rawPhone);
  if (!driverName) throw new Error("Driver name is required.");
  if (driverPhone.length < 10) {
    throw new Error("Enter a valid 10-digit phone number.");
  }

  const existing = await prisma.tankerDriver.findFirst({
    where: { driverName, driverPhone },
  });
  if (existing) {
    return {
      id: existing.id,
      driverName: existing.driverName,
      driverPhone: existing.driverPhone,
      created: false as const,
    };
  }

  const driver = await prisma.tankerDriver.create({
    data: { driverName, driverPhone },
  });
  revalidatePath("/tanker");
  return {
    id: driver.id,
    driverName: driver.driverName,
    driverPhone: driver.driverPhone,
    created: true as const,
  };
}

async function findOrCreateTankerForDate(date: Date) {
  const tankerDate = startOfDay(date);
  const monthOf = format(tankerDate, "MM");
  const yearOf = format(tankerDate, "yyyy");
  const tankerNo = format(tankerDate, "yyyyMMdd");

  const existing = await prisma.tanker.findFirst({
    where: {
      tankerDate: {
        gte: startOfDay(tankerDate),
        lte: endOfDay(tankerDate),
      },
    },
  });
  if (existing) return existing;

  return prisma.tanker.create({
    data: { tankerNo, tankerDate, monthOf, yearOf },
  });
}

async function upsertMonthlySummary(
  driverId: string,
  date: Date,
  waterLiters: number,
  amount: number
) {
  const monthOf = format(date, "MM");
  const yearOf = format(date, "yyyy");

  const existing = await prisma.tankerDriverMonthlySummary.findFirst({
    where: { driverId, monthOf, yearOf },
  });

  if (existing) {
    await prisma.tankerDriverMonthlySummary.update({
      where: { id: existing.id },
      data: {
        totalWaterLiters: existing.totalWaterLiters + waterLiters,
        totalAmount: String(parseAmount(existing.totalAmount) + amount),
      },
    });
    return;
  }

  await prisma.tankerDriverMonthlySummary.create({
    data: {
      driverId,
      monthOf,
      yearOf,
      totalWaterLiters: waterLiters,
      totalAmount: String(amount),
    },
  });
}

export async function getTankerDrivers(): Promise<TankerDriverOption[]> {
  return prisma.tankerDriver.findMany({
    orderBy: { driverName: "asc" },
    select: { id: true, driverName: true, driverPhone: true },
  });
}

export async function createTankerBooking(params: {
  bookingDate: Date;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  waterLiters: number;
  amount: string;
}) {
  const liters = Math.max(1, Math.floor(params.waterLiters));
  const amountNum = parseAmount(params.amount);
  if (amountNum <= 0) throw new Error("Amount must be greater than zero.");

  let driver;
  if (params.driverId) {
    driver = await prisma.tankerDriver.findUnique({
      where: { id: params.driverId },
    });
    if (!driver) throw new Error("Driver not found.");
  } else {
    driver = await findOrCreateDriver(
      params.driverName ?? "",
      params.driverPhone ?? ""
    );
  }
  const tanker = await findOrCreateTankerForDate(params.bookingDate);

  const booking = await prisma.tankerBooking.create({
    data: {
      tankerId: tanker.id,
      driverId: driver.id,
      waterLiters: liters,
      amount: String(amountNum),
    },
  });

  await upsertMonthlySummary(driver.id, params.bookingDate, liters, amountNum);

  revalidatePath("/tanker");
  return booking;
}

export async function listTankerBookings(params: {
  dateFrom?: Date;
  dateTo?: Date;
  driverId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  rows: TankerBookingRow[];
  totalCount: number;
  pageCount: number;
}> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
  const dateFilter = bookingDateFilter(params.dateFrom, params.dateTo);

  const where = {
    ...(params.driverId ? { driverId: params.driverId } : {}),
    ...(dateFilter
      ? {
          tanker: {
            tankerDate: dateFilter,
          },
        }
      : {}),
  };

  const [bookings, totalCount] = await Promise.all([
    prisma.tankerBooking.findMany({
      where,
      include: {
        driver: true,
        tanker: true,
      },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.tankerBooking.count({ where }),
  ]);

  const rows: TankerBookingRow[] = bookings.map((b) => ({
    id: b.id,
    driverId: b.driverId,
    driverName: b.driver.driverName,
    driverPhone: b.driver.driverPhone,
    waterLiters: b.waterLiters,
    amount: b.amount,
    tankerDate: b.tanker.tankerDate,
    createdAt: b.createdAt,
  }));

  return {
    rows,
    totalCount,
    pageCount: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function getDriverSummaries(params: {
  dateFrom?: Date;
  dateTo?: Date;
}): Promise<DriverSummaryRow[]> {
  const dateFilter = bookingDateFilter(params.dateFrom, params.dateTo);

  const bookings = await prisma.tankerBooking.findMany({
    where: dateFilter
      ? {
          tanker: {
            tankerDate: dateFilter,
          },
        }
      : undefined,
    include: { driver: true },
  });

  const map = new Map<string, DriverSummaryRow>();

  for (const b of bookings) {
    const existing = map.get(b.driverId);
    const amount = parseAmount(b.amount);
    if (existing) {
      existing.totalWaterLiters += b.waterLiters;
      existing.totalAmount += amount;
      existing.bookingCount += 1;
    } else {
      map.set(b.driverId, {
        driverId: b.driverId,
        driverName: b.driver.driverName,
        driverPhone: b.driver.driverPhone,
        totalWaterLiters: b.waterLiters,
        totalAmount: amount,
        bookingCount: 1,
      });
    }
  }

  return [...map.values()].sort((a, b) =>
    a.driverName.localeCompare(b.driverName)
  );
}

export async function getDriverBookings(params: {
  driverId: string;
  dateFrom?: Date;
  dateTo?: Date;
}): Promise<TankerBookingRow[]> {
  const result = await listTankerBookings({
    driverId: params.driverId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: 1,
    pageSize: 500,
  });
  return result.rows.sort(
    (a, b) => b.tankerDate.getTime() - a.tankerDate.getTime()
  );
}

export async function updateTankerDriver(
  id: string,
  params: { driverName: string; driverPhone: string }
) {
  const driverName = normDriverName(params.driverName);
  const driverPhone = normDriverPhone(params.driverPhone);
  if (!driverName) throw new Error("Driver name is required.");
  if (driverPhone.length < 10) {
    throw new Error("Enter a valid 10-digit phone number.");
  }

  const existing = await prisma.tankerDriver.findUnique({ where: { id } });
  if (!existing) throw new Error("Driver not found.");

  const duplicate = await prisma.tankerDriver.findFirst({
    where: { driverName, driverPhone, NOT: { id } },
  });
  if (duplicate) {
    throw new Error("A driver with this name and phone already exists.");
  }

  await prisma.tankerDriver.update({
    where: { id },
    data: { driverName, driverPhone },
  });
  revalidatePath("/tanker");
  return { id, driverName, driverPhone };
}

export async function updateTankerBooking(
  id: string,
  params: {
    bookingDate: Date;
    driverId: string;
    waterLiters: number;
    amount: string;
  }
) {
  const booking = await prisma.tankerBooking.findUnique({ where: { id } });
  if (!booking) throw new Error("Booking not found.");

  const liters = Math.max(1, Math.floor(params.waterLiters));
  const amountNum = parseAmount(params.amount);
  if (amountNum <= 0) throw new Error("Amount must be greater than zero.");

  const driver = await prisma.tankerDriver.findUnique({
    where: { id: params.driverId },
  });
  if (!driver) throw new Error("Driver not found.");

  const tanker = await findOrCreateTankerForDate(params.bookingDate);

  await prisma.tankerBooking.update({
    where: { id },
    data: {
      tankerId: tanker.id,
      driverId: params.driverId,
      waterLiters: liters,
      amount: String(amountNum),
    },
  });
  revalidatePath("/tanker");
}
