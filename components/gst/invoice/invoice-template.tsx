import { cn, formatCurrencyForIndia } from "@/lib/utils";
import { Users } from "@prisma/client";
import { format } from "date-fns";
import { ToWords } from "to-words";

interface PricedProduct {
  id: string;
  cgstAmt: number;
  sgstAmt: number;
  cgstRate: number;
  sgstRate: number;
  product: {
    productName: string;
    hsnCode: string;
    cgstRate: number;
    sgstRate: number;
  };
  qty: number;
  rate: number;
  taxableValue: number;
}

export const InvoiceTemplate = ({
  invoiceInfo,
  companyInfo,
}: {
  invoiceInfo: any;
  companyInfo: Users;
}) => {
  const unfilledArray = Array.from(
    {
      length: 17 - (invoiceInfo?.pricedProducts?.length || 0),
    },
    (_, i) => i + 1
  );

  const totalCgstAmt = Number(
    invoiceInfo?.pricedProducts?.reduce(
      (sum: number, product: PricedProduct) => sum + Number(product.cgstAmt),
      0
    )
  ).toFixed(2);
  const totalSgstAmt = Number(
    invoiceInfo?.pricedProducts?.reduce(
      (sum: number, product: PricedProduct) => sum + Number(product.sgstAmt),
      0
    )
  ).toFixed(2);

  const toWords = new ToWords();
  const totalInvoiceValueInWords = toWords.convert(
    Number(invoiceInfo?.totalInvoiceValue),
    { currency: true }
  );
  const totalTaxGSTInWords = toWords.convert(Number(invoiceInfo?.totalTaxGST), {
    currency: true,
  });

  return (
    <div id="divToPrint" className="text-xs text-black dark:text-white">
      <header className="pt-5">
        <div className="flex justify-between items-center mb-1">
          <div></div>
          <div className="font-bold text-center ml-56 text-lg">TAX INVOICE</div>
          <div className="italic mr-28">(ORIGINAL FOR RECIPIENT)</div>
        </div>
      </header>

      <main>
        <div className="border border-black dark:border-white mx-12">
          <div className="flex">
            <div className="w-[57%]">
              <div className="border-r border-black dark:border-white px-1">
                <p className="font-bold uppercase">
                  {companyInfo?.companyName}
                </p>
                <p className="w-72 uppercase">{companyInfo?.companyAddress}</p>
                <p>GSTIN/UIN : {companyInfo?.gstNo}</p>
                <p>
                  State Name : {companyInfo?.state}, Code : 0
                  {companyInfo?.stateCode}
                </p>
              </div>
              <div className="border-t border-r border-black dark:border-white px-1">
                <p>Buyer (Bill to)</p>
                <p className="font-bold">
                  {invoiceInfo?.customer?.customerName}
                </p>
                <p className="w-72">{invoiceInfo?.customer?.address}</p>
                <p>GSTIN/UIN : {invoiceInfo?.customer?.gstIn}</p>
                <p>
                  State Name : {invoiceInfo?.customer?.state}, Code : 0
                  {invoiceInfo?.customer?.stateCode}
                </p>
              </div>
            </div>

            <div className="w-[43%]">
              <div className="grid grid-cols-2">
                <span className="border-b border-r border-black dark:border-white px-1 h-[36px]">
                  <p>Invoice No.</p>
                  <p className="font-bold">{invoiceInfo?.invoiceNo}</p>
                </span>
                <span className="border-b border-black dark:border-white px-1 h-[36px]">
                  <p>Dated</p>
                  <p className="font-bold">
                    {format(invoiceInfo?.invoiceDate, "dd-MM-yyyy")}
                  </p>
                </span>
                <span className="border-b border-r border-black dark:border-white px-1 h-[36px]">
                  <p>Month</p>
                  <p className="font-bold">
                    {invoiceInfo?.monthOf}, {invoiceInfo?.yearOf}
                  </p>
                </span>
                <span className="border-b border-black dark:border-white px-1 h-[36px]">
                  <p>Mode/Terms of Payment</p>
                </span>
                <span className="border-b border-r border-black dark:border-white px-1 h-[36px]">
                  <p>Reference No. & Date</p>
                </span>
                <span className="border-b border-black dark:border-white px-1 h-[36px]">
                  <p>Other References</p>
                </span>
              </div>
              <div className="px-1">
                <p>Terms of Delivery</p>
              </div>
            </div>
          </div>

          <div className="relative max-h-[37.5rem] w-full text-center border-y border-black dark:border-white">
            <div className="flex border-b border-black dark:border-white items-center text-center">
              <div className="border-r border-black dark:border-white w-10">
                Sl No.
              </div>
              <div className="border-r border-black dark:border-white w-[322px] px-1">
                Description of Goods
              </div>
              <div className="border-r border-black dark:border-white w-[4.5rem]">
                HSN/SAC
              </div>
              <div className="border-r border-black dark:border-white w-20">
                Quantity
              </div>
              <div className="border-r border-black dark:border-white w-20">
                Rate
              </div>
              <div className="w-32 pr-1">Amount</div>
            </div>

            <div>
              {invoiceInfo?.pricedProducts?.map(
                (item: PricedProduct, i: number) => (
                  <div key={item.id} className="flex w-full text-center">
                    <div className="border-r border-black dark:border-white w-10">
                      {i + 1}
                    </div>
                    <div className="border-r border-black dark:border-white w-[322px] text-start px-1 font-bold">
                      {item?.product?.productName}
                    </div>
                    <div className="border-r border-black dark:border-white w-[4.5rem]">
                      {item?.product?.hsnCode}
                    </div>
                    <div className="border-r border-black dark:border-white w-20">
                      {item?.qty}
                    </div>
                    <div className="border-r border-black dark:border-white w-20">
                      {item?.rate.toFixed(2)}
                    </div>
                    <div className="w-32 text-end pr-1">
                      {item?.taxableValue}
                    </div>
                  </div>
                )
              )}
            </div>

            {unfilledArray.map((_, i) => (
              <UnfilledProductTable key={i} />
            ))}

            {!invoiceInfo.isOutsideDelhiInvoice ? (
              <>
                <div className="w-full flex border-black dark:border-white items-center text-center">
                  <div className="border-r border-black dark:border-white w-10">
                     
                  </div>
                  <div className="border-r border-black dark:border-white w-[322px] text-end px-1 italic font-bold">
                    CGST %
                  </div>
                  <div className="border-r border-black dark:border-white w-[4.5rem]">
                     
                  </div>
                  <div className="border-r border-black dark:border-white w-20">
                     
                  </div>
                  <div className="border-r border-black dark:border-white w-20">
                     
                  </div>
                  <div className="w-32 text-end pr-1">{totalCgstAmt}</div>
                </div>

                <div className="w-full flex border-black dark:border-white items-center text-center">
                  <div className="border-r border-black dark:border-white w-10">
                     
                  </div>
                  <div className="border-r border-black dark:border-white w-[322px] text-end px-1 italic font-bold">
                    SGST %
                  </div>
                  <div className="border-r border-black dark:border-white w-[4.5rem]">
                     
                  </div>
                  <div className="border-r border-black dark:border-white w-20">
                     
                  </div>
                  <div className="border-r border-black dark:border-white w-20">
                     
                  </div>
                  <div className="w-32 text-end pr-1">{totalSgstAmt}</div>
                </div>
              </>
            ) : (
              <div className="w-full flex border-black dark:border-white items-center text-center">
                <div className="border-r border-black dark:border-white w-10">
                   
                </div>
                <div className="border-r border-black dark:border-white w-[322px] text-end px-1 italic font-bold">
                  IGST %
                </div>
                <div className="border-r border-black dark:border-white w-[4.5rem]">
                   
                </div>
                <div className="border-r border-black dark:border-white w-20">
                   
                </div>
                <div className="border-r border-black dark:border-white w-20">
                   
                </div>
                <div className="w-32 text-end pr-1">
                  {(Number(totalCgstAmt) + Number(totalSgstAmt)).toFixed(2)}
                </div>
              </div>
            )}

            <div className="absolute bottom-0 w-full flex border-t border-black dark:border-white items-center text-center">
              <div className="border-r border-black dark:border-white w-10"></div>
              <div className="border-r border-black dark:border-white w-[322px] text-end px-1">
                Total
              </div>
              <div className="border-r border-black dark:border-white w-[4.5rem]"></div>
              <div className="border-r border-black dark:border-white w-20"></div>
              <div className="border-r border-black dark:border-white w-20"></div>
              <div className="w-32 text-end font-bold pr-1">
                {formatCurrencyForIndia(invoiceInfo?.totalInvoiceValue)}
              </div>
            </div>

            {unfilledArray.map((item) => (
              <UnfilledProductTable key={item} />
            ))}
          </div>

          <div className="border-b border-black dark:border-white flex justify-between px-1">
            <div>
              <p>Amount Chargeable (in words)</p>
              <p className="font-bold">INR {totalInvoiceValueInWords}</p>
            </div>
            <div className="italic">E. & O.E</div>
          </div>

          <div className="flex text-center">
            <div
              className={cn(
                "border-b border-r border-black dark:border-white",
                invoiceInfo.isOutsideDelhiInvoice ? "w-[26.2rem]" : "w-80"
              )}
            >
              <div>HSN/SAC</div>
            </div>

            <div className="flex border-b border-black dark:border-white text-center">
              <div className="w-20 border-r px-2 border-black dark:border-white">
                <div>Taxable Value</div>
              </div>

              {!invoiceInfo.isOutsideDelhiInvoice ? (
                <>
                  <div>
                    <div className="border-b border-r border-black dark:border-white">
                      Central Tax
                    </div>
                    <div className="flex">
                      <div className="w-12 border-r border-black dark:border-white">
                        Rate
                      </div>
                      <div className="w-16 border-r border-black dark:border-white">
                        Amount
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="border-b border-r border-black dark:border-white">
                      State Tax
                    </div>
                    <div className="flex">
                      <div className="w-12 border-r border-black dark:border-white">
                        Rate
                      </div>
                      <div className="w-16 border-r border-black dark:border-white">
                        Amount
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="border-b border-r border-black dark:border-white">
                    IGST
                  </div>
                  <div className="flex">
                    <div className="w-12 border-r border-black dark:border-white">
                      Rate
                    </div>
                    <div className="w-16 border-r border-black dark:border-white">
                      Amount
                    </div>
                  </div>
                </div>
              )}

              <div className="w-[103px] border-black dark:border-white">
                <div>Total</div>
                Tax Amount
              </div>
            </div>
          </div>

          <div className="w-full">
            {invoiceInfo?.pricedProducts?.map((item: PricedProduct) => (
              <div key={item.id} className="flex">
                <div
                  className={cn(
                    invoiceInfo.isOutsideDelhiInvoice ? "w-[26.2rem]" : "w-80"
                  )}
                >
                  <div className="border-b border-r border-black dark:border-white text-start px-1">
                    {item?.product?.hsnCode}
                  </div>
                </div>

                <div className="flex text-center">
                  <div className="w-20 border-b border-r border-black dark:border-white">
                    {item?.taxableValue}
                  </div>

                  {invoiceInfo.isOutsideDelhiInvoice ? (
                    <div className="flex">
                      <div className="w-12 border-b border-r border-black dark:border-white">
                        {Number(item?.cgstRate) +
                          Number(item?.sgstRate)}
                        %
                      </div>
                      <div className="w-16 border-b border-r border-black dark:border-white">
                        {(
                          Number(item?.cgstAmt) + Number(item?.sgstAmt)
                        ).toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex">
                        <div className="w-12 border-b border-r border-black dark:border-white">
                          {Number(item?.cgstRate)}%
                        </div>
                        <div className="w-16 border-b border-r border-black dark:border-white">
                          {Number(item?.cgstAmt).toFixed(2)}
                        </div>
                      </div>

                      <div className="flex">
                        <div className="w-12 border-b border-r border-black dark:border-white">
                          {Number(item?.sgstRate)}%
                        </div>
                        <div className="w-16 border-b border-r border-black dark:border-white">
                          {Number(item?.sgstAmt).toFixed(2)}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="w-[103px] border-b border-black dark:border-white">
                    {(Number(item?.cgstAmt) + Number(item?.sgstAmt)).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex">
              <div
                className={cn(
                  invoiceInfo.isOutsideDelhiInvoice ? "w-[26.2rem]" : "w-80"
                )}
              >
                <div className="border-b border-r border-black dark:border-white text-right px-1">
                  Total
                </div>
              </div>

              <div className="flex text-center font-bold">
                <div className="w-20 border-b border-r border-black dark:border-white">
                  {Number(invoiceInfo?.totalTaxableValue).toFixed(2)}
                </div>
                {invoiceInfo.isOutsideDelhiInvoice ? (
                  <div className="flex">
                    <div className="w-12 border-b border-r border-black dark:border-white">
                       
                    </div>
                    <div className="w-16 border-b border-r border-black dark:border-white">
                      {(Number(totalCgstAmt) + Number(totalSgstAmt)).toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex">
                      <div className="w-12 border-b border-r border-black dark:border-white">
                         
                      </div>
                      <div className="w-16 border-b border-r border-black dark:border-white">
                        {totalCgstAmt}
                      </div>
                    </div>

                    <div className="flex">
                      <div className="w-12 border-b border-r border-black dark:border-white">
                         
                      </div>
                      <div className="w-16 border-b border-r border-black dark:border-white">
                        {totalSgstAmt}
                      </div>
                    </div>
                  </>
                )}

                {invoiceInfo.isOutsideDelhiInvoice ? (
                  <div className="w-[103px] border-b border-black dark:border-white">
                    {(Number(totalCgstAmt) + Number(totalSgstAmt)).toFixed(2)}
                  </div>
                ) : (
                  <div className="w-[103px] border-b border-black dark:border-white">
                    {(Number(totalCgstAmt) + Number(totalSgstAmt)).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <span className="px-1">
              Tax Amount (in words) :
              <span className="font-bold">INR {totalTaxGSTInWords}</span>
            </span>
            <div className="flex w-full justify-between">
              {/* Fixed Width Left Column */}
              <div className="w-[450px]"></div>

              {/* Right Column Takes Only What It Needs */}
              <div className="flex-shrink-0 px-1">
                <p>Company&apos;s Bank Details</p>
                <table>
                  <thead>
                    <tr>
                      <td>Bank Name</td>
                      <td className="font-bold">: {companyInfo?.bankName}</td>
                    </tr>
                    <tr>
                      <td>A/c No.</td>
                      <td className="font-bold">
                        : {companyInfo?.bankAccountNo}
                      </td>
                    </tr>
                    <tr>
                      <td>Branch & IFSC Code</td>
                      <td className="font-bold">
                        : {companyInfo?.bankBranch} &{" "}
                        {companyInfo?.bankIfscCode}
                      </td>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>

            <div className="w-full flex">
              <div className="px-1 w-2/4">
                <p>Declaration :</p>
                We declare that this invoice shows the actual price of the goods
                described and that all the particulars are true & correct.
              </div>
              <div className="border-t border-l border-black dark:border-white flex flex-col justify-between px-1 w-2/4">
                <div className="text-end font-bold">
                  for {companyInfo?.companyName}
                </div>
                <div className="text-end">Authorised Signatory</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer>
        <p className="text-center mt-1">This is a Computer Generated Invoice</p>
      </footer>
    </div>
  );
};

const UnfilledProductTable = () => {
  return (
    <div className="flex items-center text-center">
      <div className="border-r border-black dark:border-white w-10"> </div>
      <div className="border-r border-black dark:border-white w-[322px] px-1">
         
      </div>
      <div className="border-r border-black dark:border-white w-[4.5rem]">
         
      </div>
      <div className="border-r border-black dark:border-white w-20"> </div>
      <div className="border-r border-black dark:border-white w-20"> </div>
      <div className="w-32 pr-1"></div>
    </div>
  );
};
