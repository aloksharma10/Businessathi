import type { CustomTableLayout, TableCell } from "pdfmake/interfaces";

/** Rule (border line) width in pt. */
export const RULE = 0.6;
const PAD_X = 3;
const PAD_Y = 1.5;

/**
 * Decides whether the rule at `index` is drawn. `count` is the number of
 * rows/columns, so `index === 0` is the outer top/left edge and
 * `index === count` the outer bottom/right edge.
 */
export type RulePredicate = (index: number, count: number) => boolean;

export const ALL: RulePredicate = () => true;
export const NONE: RulePredicate = () => false;
/** Only the outer edges. */
export const OUTER: RulePredicate = (i, n) => i === 0 || i === n;
/** Only the rules between cells, never the outer edges. */
export const INNER: RulePredicate = (i, n) => i > 0 && i < n;
/** Everything except the top edge — lets a table sit flush under the previous one. */
export const NO_TOP: RulePredicate = (i) => i !== 0;

export function ruledLayout({
  h = ALL,
  v = ALL,
  padX = PAD_X,
  padY = PAD_Y,
  defaultBorder,
}: {
  h?: RulePredicate;
  v?: RulePredicate;
  padX?: number;
  padY?: number;
  defaultBorder?: boolean;
} = {}): CustomTableLayout {
  return {
    hLineWidth: (i, node) => (h(i, node.table.body.length) ? RULE : 0),
    vLineWidth: (i, node) => (v(i, node.table.body[0]?.length ?? 0) ? RULE : 0),
    hLineColor: () => "#000000",
    vLineColor: () => "#000000",
    paddingLeft: () => padX,
    paddingRight: () => padX,
    paddingTop: () => padY,
    paddingBottom: () => padY,
    ...(defaultBorder === undefined ? {} : { defaultBorder }),
  };
}

export const blankRow = (columns: number): TableCell[] =>
  Array.from({ length: columns }, () => ({ text: "" }));

/** A "label above bold value" cell, as used in the invoice header grid. */
export const labelledValue = (label: string, value = ""): TableCell => ({
  stack: [{ text: label }, { text: value, bold: true }],
});
