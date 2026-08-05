"use client";

import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { inputClass } from "./Field";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", hasError = false, ...props },
  ref,
) {
  return (
    <input ref={ref} className={`${inputClass(hasError)} ${className}`} {...props} />
  );
});
