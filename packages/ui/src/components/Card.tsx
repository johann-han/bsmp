import { ReactNode } from "react";

interface CardProps {

    children: ReactNode;

}

export function Card({
    children,
}: CardProps) {

    return (

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            {children}

        </div>

    );

}