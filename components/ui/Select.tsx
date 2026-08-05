"use client";

import type { SelectHTMLAttributes } from "react";
import { forwardRef } from "react";
import { inputClass } from "./Field";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = "", hasError = false, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={`${inputClass(hasError)} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});
