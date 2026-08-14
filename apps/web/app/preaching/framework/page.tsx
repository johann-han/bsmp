import { SermonFrameworkWorkspace } from "../../../src/features/preaching/SermonFrameworkWorkspace";

interface SermonFrameworkPageProps {
    searchParams: Promise<{ studyId?: string }>;
}

export default async function SermonFrameworkPage({ searchParams }: SermonFrameworkPageProps) {
    const params = await searchParams;
    return <SermonFrameworkWorkspace studyId={params.studyId ?? ""} />;
}
