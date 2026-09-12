/**
 * The money on a bid.
 *
 * One place computes every figure a bid carries, and the server calls it on
 * save. The client may show the same arithmetic while the form is being filled
 * — it has to, or the bidder is typing blind — but nothing it sends is stored.
 * A bid is a financial commitment, and letting the browser tell the server what
 * a bid is worth would let anyone name their own platform fee.
 *
 * Two decisions worth stating, because both are choices rather than mechanics:
 *
 *   1. **The platform fee is charged on the contract value, not on the VAT.**
 *      VAT is collected for the Tax Authority; it is not the supplier's income
 *      and it is not the platform's to take a percentage of. Charging 5% of a
 *      VAT-inclusive total would quietly bill the supplier for 5% of the state's
 *      money.
 *
 *   2. **Amounts are held in baisa — whole numbers.** One rial is 1000 baisa.
 *      Money in floating point accumulates error: 0.1 + 0.2 is famously not
 *      0.3, and a bid summing forty line items would drift from what the
 *      supplier typed. Integers cannot drift. Rials are a presentation format,
 *      converted at the edges.
 */

/** Baisa in one Omani rial. */
const BAISA = 1000;

/** Oman's standard VAT rate. Some supplies are zero-rated, so it is per bid. */
const DEFAULT_VAT_RATE = 5;

/**
 * The platform's commission, charged on award rather than on submission.
 * A bidder sees it before they commit, which is the point of showing the net.
 */
const PLATFORM_FEE_RATE = 5;

/** Rials (a decimal the user typed) to whole baisa. */
const toBaisa = (rials) => Math.round(Number(rials || 0) * BAISA);

/** Baisa back to rials, for display and for the API's convenience. */
const toRials = (baisa) => Math.round(Number(baisa || 0)) / BAISA;

/**
 * Percentage of an integer amount, rounded to the nearest baisa.
 * Half-up, so a fee is never silently rounded in the platform's favour by a
 * banker's-rounding rule nobody agreed to.
 */
const percentOf = (baisa, rate) => Math.round((Number(baisa) * Number(rate)) / 100);

/**
 * Everything derived from a bid's line items.
 *
 * @param {Array<{quantity:number, unitPrice:number}>} lineItems  unitPrice in rials
 * @param {object} opts
 * @param {number} [opts.vatRate]         percent; 0 for a zero-rated supply
 * @param {number} [opts.platformFeeRate] percent
 * @returns figures in baisa, plus the line totals
 */
function priceBid(lineItems = [], opts = {}) {
  const vatRate = Number.isFinite(Number(opts.vatRate)) ? Number(opts.vatRate) : DEFAULT_VAT_RATE;
  const feeRate = Number.isFinite(Number(opts.platformFeeRate))
    ? Number(opts.platformFeeRate)
    : PLATFORM_FEE_RATE;

  const lines = (Array.isArray(lineItems) ? lineItems : []).map((li) => {
    const quantity = Math.max(0, Number(li.quantity) || 0);
    const unitPriceBaisa = Math.max(0, toBaisa(li.unitPrice));
    // Quantity is a count, so this stays exact: an integer times an integer.
    return { ...li, quantity, unitPriceBaisa, lineTotalBaisa: quantity * unitPriceBaisa };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalBaisa, 0);
  const vatAmount = percentOf(subtotal, vatRate);
  const total = subtotal + vatAmount;

  // On the contract value. See the note at the top of this file.
  const platformFee = percentOf(subtotal, feeRate);

  return {
    lines,
    vatRate,
    platformFeeRate: feeRate,
    subtotalBaisa: subtotal,
    vatAmountBaisa: vatAmount,
    totalBaisa: total,
    platformFeeBaisa: platformFee,
    // What actually reaches the bidder if this bid wins.
    netToBidderBaisa: total - platformFee
  };
}

module.exports = {
  BAISA,
  DEFAULT_VAT_RATE,
  PLATFORM_FEE_RATE,
  toBaisa,
  toRials,
  percentOf,
  priceBid
};
