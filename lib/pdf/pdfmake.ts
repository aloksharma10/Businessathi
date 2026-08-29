import path from "path";
import pdfmake from "pdfmake";
import robotoFonts from "pdfmake/fonts/Roboto";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

/**
 * Server-side pdfmake configured once per process.
 *
 * Roboto ships with pdfmake and covers the glyphs we print (including "₹",
 * which the built-in Helvetica lacks). The access policies keep pdfmake from
 * fetching anything over the network or reading files outside its font dir.
 */
const fontsDir = path.dirname(robotoFonts.Roboto.normal);

pdfmake.setFonts(robotoFonts);
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((filePath) =>
  path.resolve(filePath).startsWith(fontsDir)
);

export async function renderPdf(
  docDefinition: TDocumentDefinitions
): Promise<Buffer> {
  return pdfmake.createPdf(docDefinition).getBuffer();
}
