const qtyIntFmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const qtyDecimalFmt = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatQty(
  qty: number,
  opts?: { isWeighted?: boolean; unitLabel?: string | null; withUnit?: boolean },
): string {
  const isWeighted = !!opts?.isWeighted;
  const unit = opts?.unitLabel ?? (isWeighted ? "" : "pcs");
  const withUnit = opts?.withUnit ?? true;
  const num = isWeighted ? qtyDecimalFmt.format(qty) : qtyIntFmt.format(qty);
  if (!withUnit || !unit) return num;
  return `${num} ${unit}`;
}
