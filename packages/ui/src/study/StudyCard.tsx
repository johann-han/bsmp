interface StudyCardProps {
    title: string;
    passage: string;
    status: string;
}

export function StudyCard({
    title,
    passage,
    status,
}: StudyCardProps) {

    return (

        <div className="rounded-lg border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">

            <div className="flex items-center justify-between">

                <h3 className="text-lg font-semibold">
                    {title}
                </h3>

                <span className="rounded bg-slate-100 px-2 py-1 text-sm">
                    {status}
                </span>

            </div>

            <p className="mt-2 text-slate-600">
                {passage}
            </p>

        </div>

    );

}