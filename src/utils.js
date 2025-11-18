import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function createPageUrl(pageName) {
  if (pageName === 'Dashboard') return '/';
  return `/${pageName.toLowerCase()}`; // 예: RoutePlanning -> /routeplanning
}