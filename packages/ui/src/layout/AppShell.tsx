import { ReactNode } from "react";

interface AppShellProps {
    title: string;
    children: ReactNode;
}

export function AppShell({ title, children }: AppShellProps) {
    return (
        <main className="min-h-screen bg-slate-100">
            <div className="mx-auto w-full max-w-[1800px] px-4 py-5 md:px-8 md:py-7">
                <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                {children}
            </div>
        </main>
    );
}
