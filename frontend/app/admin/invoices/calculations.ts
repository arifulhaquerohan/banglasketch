export type InvoiceItem = { description: string; quantity: number; rate: number };
// API inputs have two decimal places. BigInt keeps intermediate products exact,
// including large invoices whose scaled totals exceed Number.MAX_SAFE_INTEGER.
const hundred = BigInt(100);
const scaled = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return BigInt(0);
  const [whole, fraction = ""] = value.toFixed(2).split(".");
  return BigInt(whole) * hundred + BigInt(fraction.padEnd(2, "0"));
};
const roundedDivide = (value: bigint, divisor: bigint) => (value + divisor / BigInt(2)) / divisor;
const money = (value: bigint) => Number(value) / 100;
export function invoiceTotals(items: InvoiceItem[], discountPercent: number, taxPercent: number, paid: number) {
  const lines = items.map(item => roundedDivide(scaled(item.quantity) * scaled(item.rate), hundred));
  const subtotal = lines.reduce((sum, value) => sum + value, BigInt(0));
  const discount = roundedDivide(subtotal * scaled(discountPercent), BigInt(10000));
  const tax = roundedDivide((subtotal - discount) * scaled(taxPercent), BigInt(10000));
  const total = subtotal - discount + tax;
  const balance = total - scaled(paid);
  return { lines: lines.map(money), subtotal: money(subtotal), discount: money(discount), tax: money(tax), total: money(total), due: money(balance > BigInt(0) ? balance : BigInt(0)), credit: money(balance < BigInt(0) ? -balance : BigInt(0)) };
}
