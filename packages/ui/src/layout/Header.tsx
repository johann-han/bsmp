interface HeaderProps {

    title: string;

}

export function Header({
    title,
}: HeaderProps) {

    return (

        <header className="border-b bg-white px-10 py-6">

            <h1 className="text-3xl font-bold tracking-tight">

                {title}

            </h1>

        </header>

    );

}