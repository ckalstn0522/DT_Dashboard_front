import React from "react";

export const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
    outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
    ghost: "hover:bg-slate-100 hover:text-slate-900",
  };
  
  const variantStyles = variants[variant || "default"];
  
  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    />
  );
});
Button.displayName = "Button";