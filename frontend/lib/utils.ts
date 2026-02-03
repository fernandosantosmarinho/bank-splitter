import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
    return '/jpeg_icon.png';
  }
  return '/pdf_icon.png';
}
