/**
 * Formats amount in full rupees with Indian numbering system.
 * Keeps the legacy formatLakhs name but outputs e.g. ₹58,52,376.92
 */
export function formatLakhs(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats amount in full rupees if required, e.g. 18.42 lakhs = ₹18,42,000
 */
export function formatRupeesFull(lakhs: number): string {
  const rupees = Math.round(lakhs * 100000);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Formats a percentage value. e.g. 42 -> "42%"
 */
export function formatPercent(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '0%';
  return `${Math.round(val)}%`;
}

/**
 * Formats a date string (YYYY-MM-DD) into standard legible format: "03 Sep 2026"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
