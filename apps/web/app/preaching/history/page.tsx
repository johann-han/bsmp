import { SermonHistoryWorkspace } from "../../../src/features/preaching/SermonHistoryWorkspace";

interface Props { searchParams: Promise<{ studyId?: string }> }

export default async function SermonHistoryPage({ searchParams }: Props) {
    const params = await searchParams;
    return <SermonHistoryWorkspace studyId={params.studyId ?? ""} />;
}
