import { ReactNode } from "react";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface AppShellProps {

    title: string;
    children: ReactNode;

}

export function AppShell({
    title,
    children,
}: AppShellProps) {

    return (

        <div className="flex min-h-screen bg-slate-100">

            <Sidebar />

            <div className="flex flex-1 flex-col">

                <Header title={title} />

                <main className="flex-1 p-8">

                    {children}

                </main>

            </div>

        </div>

    );

}