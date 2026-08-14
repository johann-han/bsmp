import { SermonExpositionWorkspace } from "../../../src/features/preaching/SermonExpositionWorkspace";

interface SermonExpositionPageProps {
    searchParams: Promise<{ studyId?: string }>;
}

export default async function SermonExpositionPage({ searchParams }: SermonExpositionPageProps) {
    const params = await searchParams;
    return <SermonExpositionWorkspace studyId={params.studyId ?? ""} />;
}
