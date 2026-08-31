import { SermonPreparationOverview } from "../../../src/features/preaching/SermonPreparationOverview";

interface Props {
    searchParams: Promise<{ studyId?: string }>;
}

export default async function SermonOverviewPage({ searchParams }: Props) {
    const params = await searchParams;
    return <SermonPreparationOverview studyId={params.studyId ?? ""} />;
}
