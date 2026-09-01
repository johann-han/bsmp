import { SermonFinalDraftWorkspace } from "../../../src/features/preaching/SermonFinalDraftWorkspace";

interface Props {
    searchParams: Promise<{ studyId?: string }>;
}

export default async function FinalSermonDraftPage({ searchParams }: Props) {
    const params = await searchParams;
    return <SermonFinalDraftWorkspace studyId={params.studyId ?? ""} />;
}
