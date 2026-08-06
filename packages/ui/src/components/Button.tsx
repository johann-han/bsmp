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
        "rounded-lg px-4 py-2 font-medium transition-colors focus:outline-none";

    const variants = {
        primary:
            "bg-blue-600 text-white hover:bg-blue-700",

        secondary:
            "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
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