import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ComponentProps } from 'react';
const variants=cva('inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:pointer-events-none disabled:opacity-50',{variants:{variant:{default:'bg-teal-800 text-white hover:bg-teal-900',outline:'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',ghost:'text-slate-600 hover:bg-slate-100'},size:{default:'h-10 px-4',icon:'size-10'}},defaultVariants:{variant:'default',size:'default'}});
export function Button({className,variant,size,asChild=false,...props}:ComponentProps<'button'>&VariantProps<typeof variants>&{asChild?:boolean}){const Component=asChild?Slot:'button';return <Component className={twMerge(clsx(variants({variant,size}),className))} {...props}/>;}
