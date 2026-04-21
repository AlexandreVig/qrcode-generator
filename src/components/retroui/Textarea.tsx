import { cn } from "@/lib/utils";

import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  placeholder = "Enter text...",
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
}) {
  const invalid = Boolean(props["aria-invalid"]);

  return (
    <textarea
      placeholder={placeholder}
      rows={4}
      className={cn(
        "px-4 py-2 w-full border-2 rounded border-border shadow-md transition focus:outline-hidden focus:shadow-xs placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed",
        invalid ? "border-destructive text-destructive shadow-xs shadow-destructive" : "",
        className
      )}
      {...props}
    />
  );
}
