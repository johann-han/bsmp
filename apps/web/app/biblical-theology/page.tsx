import { redirect } from "next/navigation";

import { BiblicalTheologyWorkspace } from "../../src/features/biblical-theology/BiblicalTheologyWorkspace";
import { AppShell } from "@repo/ui";

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
