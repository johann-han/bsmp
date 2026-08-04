import { ReactNode } from "react";

interface BadgeProps {

    children: ReactNode;

}

export function Badge({
    children,
}: BadgeProps) {

    return (

        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">

            {children}

        </span>

    );

}