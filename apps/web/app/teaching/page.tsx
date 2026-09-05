import { TeachingWorkspace } from "../../src/features/teaching/TeachingWorkspace";

export default async function TeachingPage({ searchParams }: { searchParams: Promise<{ studyId?: string }> }) {
    const params = await searchParams;
    return <TeachingWorkspace studyId={params.studyId ?? ""} />;
}
