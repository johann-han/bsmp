import { BiblicalResearchWorkspace } from "../../src/features/research/BiblicalResearchWorkspace";

interface Props {
    searchParams: Promise<{ studyId?: string }>;
}

export default async function ResearchPage({ searchParams }: Props) {
    const params = await searchParams;
    return <BiblicalResearchWorkspace studyId={params.studyId ?? ""} />;
}
