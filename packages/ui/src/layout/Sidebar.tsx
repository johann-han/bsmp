interface SidebarProps {

    current?: string;

}

const items = [
    {
        label: "Dashboard",
        href: "/",
    },
    {
        label: "Bible",
        href: "/bible",
    },
    {
        label: "Studies",
        href: "/studies",
    },
    {
        label: "Workspace",
        href: "/workspace",
    },
    {
        label: "Settings",
        href: "/settings",
    },
];

export function Sidebar({
    current,
}: SidebarProps) {

    return (

        <aside className="flex h-screen w-72 flex-col border-r bg-slate-900 text-white">

            <div className="border-b border-slate-700 p-6">

                <h1 className="text-2xl font-bold">
                    BSMP
                </h1>

            </div>

            <nav className="flex flex-col gap-2 p-4">

                {items.map((item) => (

                    <a
                        key={item.href}
                        href={item.href}
                        className={[
                            "rounded-lg px-4 py-3 transition-colors",
                            current === item.href
                                ? "bg-slate-700"
                                : "hover:bg-slate-800",
                        ].join(" ")}
                    >
                        {item.label}
                    </a>

                ))}

            </nav>

        </aside>

    );

}