import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Full precision — always 2 decimal places.
 * Use for: account balances, transaction amounts, anything that must be exact.
 * e.g.  292.75  →  "ETB 292.75"
 */
export function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `ETB ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

/**
 * Same as formatCurrency — 2 decimal places, just an alias used widely across pages.
 * Keeps the balance precise: 292.75 stays 292.75, never rounds to 293.
 */
export function formatCurrencyShort(amount: number): string {
  return formatCurrency(amount);
}

/**
 * Compact display for charts and headers where space is limited.
 * Still shows 2 decimal places below 1 000.
 * e.g.  292.75  →  "ETB 292.75"
 *       1 500.50 →  "ETB 1.5K"
 *       2 000 000 → "ETB 2.0M"
 */
export function formatCurrencyCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000)
    return `${sign}ETB ${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)
    return `${sign}ETB ${(abs / 1_000).toFixed(1)}K`;
  // Below 1 000 — show full precision so 292.75 is not rounded
  return `${sign}ETB ${abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
