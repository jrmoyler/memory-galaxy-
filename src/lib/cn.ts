import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Conditionally join + de-dupe Tailwind class names. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
