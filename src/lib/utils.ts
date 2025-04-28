import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * The function `formatFileSize` converts a given number of bytes into a human-readable file size
 * format.
 * @param {number} bytes - The `formatFileSize` function takes a `bytes` parameter of type number,
 * which represents the size of a file in bytes. The function converts this size into a human-readable
 * format by converting it into kilobytes (KB), megabytes (MB), gigabytes (GB), or terabytes (
 * @returns The function `formatFileSize` takes a number of bytes as input and returns a formatted
 * string representing the file size in appropriate units (Bytes, KB, MB, GB, TB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatCurrency(amount: number, showSymbol: boolean = true): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    // Only include the currency symbol if showSymbol is true
    currencyDisplay: showSymbol ? 'symbol' : 'code',
    currencySign: 'accounting'
  }).format(amount).replace('USD', '').trim();
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return "?";

  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";

  return `${firstInitial}${lastInitial}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

// Generate a random account number for bank accounts
export function generateAccountNumber(): string {
  // Generate a 10-digit random number (typical for account numbers)
  const randomNumber = Math.floor(Math.random() * 9000000000) + 1000000000;
  return randomNumber.toString();
}

