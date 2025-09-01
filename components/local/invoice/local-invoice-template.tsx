"use client";

import { formatCurrencyForIndia } from "@/lib/utils";
import { Users } from "@prisma/client";
import { format } from "date-fns";
import { ToWords } from "to-words";
import { parse } from "date-fns";

export const LocalInvoiceTemplate = ({
  invoiceInfo,
  companyInfo,
}: {
  invoiceInfo: any;
  companyInfo: Users;
}) => {
  const unfilledArray = Array.from(
    { length: 29 - invoiceInfo.pricedProducts?.length },
    (_, i) => i + 1
  );

  const toWords = new ToWords();
  const totalInvoiceValueInWords = toWords.convert(
    Number(invoiceInfo?.localTotalInvoiceValue),
    { currency: true }
  );

  return (
    <>
      <div id="divToPrint" className="text-xs">
        <header>
          <div className="text-center font-bold pt-4">BILL/CASH MEMO</div>
        </header>

        <main>
          <div className="border border-black dark:border-white mx-9">
            <div className="flex">
              <div className="flex-1">
                <div className="border-black dark:border-white border-r border-b px-1">
                  <p className="font-bold">{companyInfo.localCompanyName}</p>
                  <p>({companyInfo.localTagLine})</p>
                  <p className="w-[90%]">{companyInfo.localAddress}</p>
                  <p>
                    Mob : {companyInfo.contactNo}
                    {companyInfo.additionalContactNo &&
                      `, ${companyInfo.additionalContactNo}`}
                  </p>
                </div>

                <div className="border-black dark:border-white border-r px-1">
                  <p>Buyer (Bill to)</p>
                  <p className="font-bold">
                    {invoiceInfo?.customer?.customerName}
                  </p>
                  <p className="w-[90%]">{invoiceInfo?.customer?.address}</p>
                </div>
              </div>

              <div className="w-[35%]">
                <div className="grid grid-cols-2 justify-between border-b border-black dark:border-white w-full">
                  <div className="border-r border-b px-[2px] border-black dark:border-white">
                    Invoice No.
                    <p className="font-bold">{invoiceInfo?.localInvoiceNo}</p>
                  </div>
                  <div className="px-[2px] border-black dark:border-white border-b">
                    Dated
                    <p className="font-bold">
                      {format(invoiceInfo?.localInvoiceDate, "dd-MM-yyyy")}
                    </p>
                  </div>
                  <div className="px-[2px] border-black dark:border-white border-r">
                    Month
                    <p className="font-bold">
                      {format(parse(`${invoiceInfo?.monthOf} ${invoiceInfo?.yearOf}`, "MMMM yyyy", new Date()), "MMM yyyy")}
                    </p>
                  </div>
                  <div className="px-[2px] border-black dark:border-white">
                    References
                  </div>
                </div>
                <div className="px-[2px] border-black dark:border-white">
                  Terms of Delivery
                </div>
              </div>
            </div>

            <div className="max-h-[745px] flex flex-col">
              <div className="flex max-w-full border-black dark:border-white text-center">
                <div className="w-[5.3rem] border-r border-b border-t border-black dark:border-white px-[2px]">
                  Sl No.
                </div>
                <div className="w-[580px] border-r border-b border-t border-black dark:border-white px-1">
                  Description of Goods
                </div>
                <div className="w-36 border-r border-b border-t border-black dark:border-white">
                  Quantity
                </div>
                <div className="w-32 border-r border-b border-t border-black dark:border-white">
                  Rate
                </div>
                <div className="w-48 border-b border-t border-black dark:border-white">
                  Amount
                </div>
              </div>

              <div>
                {invoiceInfo.pricedProducts.map((item: any, i: number) => (
                  <div
                    key={item.id}
                    className="flex max-w-full border-black dark:border-white max-h-full text-center"
                  >
                    <div className="w-[5.3rem] border-r border-black dark:border-white px-[2px]">
                      {i + 1}
                    </div>
                    <div className="w-[580px] border-r border-black dark:border-white text-start px-1 font-bold">
                      {item.product?.productName}
                    </div>
                    <div className="w-36 border-r border-black dark:border-white">
                      {item.qty}
                    </div>
                    <div className="w-32 border-r border-black dark:border-white">
                      {item.rate.toFixed(2)}
                    </div>
                    <div className="w-48 border-black dark:border-white">
                      {item.productTotalValue}
                    </div>
                  </div>
                ))}
              </div>

              {unfilledArray.map((_, i) => (
                <UnfilledProductTable key={i} />
              ))}

              <div className="flex max-w-full flex-1 border-black dark:border-white max-h-full text-center border-t">
                <div className="w-[5.3rem] border-r border-black dark:border-white px-[2px]">
                  &nbsp;
                </div>
                <div className="w-[580px] border-r border-black dark:border-white text-end px-1">
                  Total
                </div>
                <div className="w-36 border-r border-black dark:border-white">
                  &nbsp;
                </div>
                <div className="w-32 border-r border-black dark:border-white">
                  &nbsp;
                </div>
                <div className="w-48 border-black dark:border-white font-bold">
                  {formatCurrencyForIndia(invoiceInfo.localTotalInvoiceValue)}
                </div>
              </div>
            </div>

            <div className="border-t border-black px-1">
              Amount Chargeable (in words)
              <p className="font-bold">INR {totalInvoiceValueInWords}</p>
            </div>

            <div className="flex w-full justify-between px-1 border-black dark:border-white border-t">
              <div className="w-[70%]">
                <p className="italic">E. & O.E.</p>
                <p>
                  We certify that the prices and details in this invoice are
                  true and correct.
                </p>
              </div>
              <div className="flex flex-col justify-between w-[30%] items-end">
                <div className="font-bold">for {companyInfo?.localCompanyName}</div>
                <div>Authorised Signatory</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

const UnfilledProductTable = () => {
  return (
    <div className="flex items-center text-center">
      <div className="w-[5.3rem] border-r border-black dark:border-white px-[2px]">
        &nbsp;
      </div>
      <div className="w-[580px] border-r border-black dark:border-white text-end px-1">
        &nbsp;
      </div>
      <div className="w-36 border-r border-black dark:border-white">&nbsp;</div>
      <div className="w-32 border-r border-black dark:border-white">&nbsp;</div>
      <div className="w-48 border-black dark:border-white">&nbsp;</div>
    </div>
  );
};
