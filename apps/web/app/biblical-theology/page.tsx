import { redirect } from "next/navigation";

import { AppShell } from "@repo/ui";
import { BiblicalTheologyWorkspace } from "../../src/features/biblical-theology/BiblicalTheologyWorkspace";

interface PageProps {
    searchParams: Promise<{ studyId?: string }>;
}

export default async function BiblicalTheologyPage({ searchParams }: PageProps) {
    const { studyId } = await searchParams;
    if (!studyId) redirect("/studies");

    return (
        <AppShell title="Biblical Theology">
            <BiblicalTheologyWorkspace studyId={studyId} />
        </AppShell>
    );
}
