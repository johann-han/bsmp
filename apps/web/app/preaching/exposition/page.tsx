import { SermonExpositionMentorPanel } from "../../../src/features/preaching/SermonExpositionMentorPanel";
import { SermonExpositionWorkspace } from "../../../src/features/preaching/SermonExpositionWorkspace";

interface SermonExpositionPageProps {
    searchParams: Promise<{ studyId?: string }>;
}

export default async function SermonExpositionPage({ searchParams }: SermonExpositionPageProps) {
    const params = await searchParams;
    const studyId = params.studyId ?? "";
    return <><SermonExpositionWorkspace studyId={studyId} /><SermonExpositionMentorPanel studyId={studyId} /></>;
}
