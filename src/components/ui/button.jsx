import React from 'react';
import { cn } from '@/lib/utils';

export default function Button({
  children,
  className,
  variant = 'default',
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    default:
      'bg-sunrise text-white hover:bg-sunrise/90 focus:ring-sunrise dark:bg-sunriseDark dark:hover:bg-sunriseDark/90',
    secondary:
      'bg-sky text-white hover:bg-sky/90 focus:ring-sky dark:bg-skyDark dark:hover:bg-skyDark/90',
    outline:
      'border border-muted text-foreground hover:bg-muted/10 dark:border-mutedDark dark:text-foreground dark:hover:bg-mutedDark/10',
  };

  return (
    <button type={type} className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
