import { AppShell, NewStudyButton, StudyList } from "@repo/ui";

const studies = [

    {
        id: "1",
        title: "Romans 8 Study",
        passage: "Romans 8:1–39",
        status: "Draft",
    },

    {
        id: "2",
        title: "John 15 Study",
        passage: "John 15:1–17",
        status: "Draft",
    },

];

export default function StudiesPage() {

    return (

        <AppShell title="Study Library">

            <div className="mb-6 flex items-center justify-between">

                <input
                    placeholder="Search studies..."
                    className="w-96 rounded-lg border px-4 py-2"
                />

                <NewStudyButton />

            </div>

            <StudyList
                studies={studies}
            />

        </AppShell>

    );

}