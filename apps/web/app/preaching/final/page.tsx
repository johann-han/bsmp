import { SermonFinalDraftWorkspace } from "../../../src/features/preaching/SermonFinalDraftWorkspace";
import { SermonTeachingTraceability } from "../../../src/features/preaching/SermonTeachingTraceability";
import { FinalSermonDraftMentorPanel } from "../../../src/features/preaching/FinalSermonDraftMentorPanel";

interface Props {
    searchParams: Promise<{ studyId?: string }>;
}

export default async function FinalSermonDraftPage({ searchParams }: Props) {
    const params = await searchParams;
    const studyId = params.studyId ?? "";
    return (
        <>
            <SermonTeachingTraceability studyId={studyId} />
            <SermonFinalDraftWorkspace studyId={studyId} />
            <FinalSermonDraftMentorPanel studyId={studyId} />
        </>
    );
}
