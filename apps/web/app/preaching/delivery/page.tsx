import { SermonDeliveryWorkspace } from "../../../src/features/preaching/SermonDeliveryWorkspace";

interface Props {
    searchParams: Promise<{ studyId?: string }>;
}

export default async function SermonDeliveryPage({ searchParams }: Props) {
    const params = await searchParams;
    return <SermonDeliveryWorkspace studyId={params.studyId ?? ""} />;
}
