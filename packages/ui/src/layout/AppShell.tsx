import { ReactNode } from "react";

interface AppShellProps {
    title: string;
    children: ReactNode;
}

export function AppShell({
    title,
    children,
}: AppShellProps) {

    return (

        <div className="min-h-screen flex bg-slate-100">

            <aside className="w-64 bg-slate-900 text-white">

                <div className="p-6 text-2xl font-bold border-b border-slate-700">
                    BSMP
                </div>

                <nav className="p-4 space-y-2">

                    <a
                        href="/"
                        className="block rounded p-2 hover:bg-slate-800"
                    >
                        Dashboard
                    </a>

                    <a
                        href="/bible"
                        className="block rounded p-2 hover:bg-slate-800"
                    >
                        Bible
                    </a>

                    <a
                        href="/studies"
                        className="block rounded p-2 hover:bg-slate-800"
                    >
                        Studies
                    </a>

                    <a
                        href="/workspace"
                        className="block rounded p-2 hover:bg-slate-800"
                    >
                        Workspace
                    </a>

                    <a
                        href="/settings"
                        className="block rounded p-2 hover:bg-slate-800"
                    >
                        Settings
                    </a>

                </nav>

            </aside>

            <main className="flex-1">

                <header className="border-b bg-white p-6">

                    <h1 className="text-3xl font-bold">
                        {title}
                    </h1>

                </header>

                <section className="p-8">

                    {children}

                </section>

            </main>

        </div>

    );

}