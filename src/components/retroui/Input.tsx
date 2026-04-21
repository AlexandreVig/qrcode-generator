import React, { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  type = "text",
  placeholder = "Enter text",
  className = "",
  ...props
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`px-4 py-2 w-full rounded border-2 shadow-md transition focus:outline-hidden focus:shadow-xs disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed ${
        props["aria-invalid"]
          ? "border-destructive text-destructive shadow-xs shadow-destructive"
          : ""
      } ${className}`}
      {...props}
    />
  );
};
