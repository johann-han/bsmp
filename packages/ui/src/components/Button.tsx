import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement> {

    children: ReactNode;

    variant?: "primary" | "secondary";

}

export function Button({
    children,
    variant = "primary",
    className = "",
    ...props
}: ButtonProps) {

    const base =
        "rounded-lg px-4 py-2 font-medium transition-colors";

    const variants = {
        primary:
            "bg-blue-600 text-white hover:bg-blue-700",

        secondary:
            "bg-slate-200 text-slate-900 hover:bg-slate-300",
    };

    return (

        <button
            {...props}
            className={`${base} ${variants[variant]} ${className}`}
        >
            {children}
        </button>

    );

}