import { SermonDeliveryWorkspace } from "../../../src/features/preaching/SermonDeliveryWorkspace";
import { SermonTeachingTraceability } from "../../../src/features/preaching/SermonTeachingTraceability";
import { SermonDeliveryMentorPanel } from "../../../src/features/preaching/SermonDeliveryMentorPanel";

interface Props {
    searchParams: Promise<{ studyId?: string }>;
}

export default async function SermonDeliveryPage({ searchParams }: Props) {
    const params = await searchParams;
    const studyId = params.studyId ?? "";
    return (
        <>
            <SermonTeachingTraceability studyId={studyId} variant="delivery" />
            <SermonDeliveryWorkspace studyId={studyId} />
            <SermonDeliveryMentorPanel studyId={studyId} />
        </>
    );
}
