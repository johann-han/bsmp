import { ResearchHistoryWorkspace } from "../../../src/features/research/ResearchHistoryWorkspace";

interface Props { searchParams: Promise<{ studyId?: string }> }

export default async function ResearchHistoryPage({ searchParams }: Props) {
    const params = await searchParams;
    return <ResearchHistoryWorkspace studyId={params.studyId ?? ""} />;
}
