"use client";

import type { TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";
import { inputClass } from "./Field";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className = "", hasError = false, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`${inputClass(hasError)} ${className}`}
        {...props}
      />
    );
  },
);
