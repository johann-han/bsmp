import Link from "next/link";
import { SermonPreparationWorkspace } from "../../src/features/preaching/SermonPreparationWorkspace";
import { SermonPreparationStudyReadinessGuard } from "../../src/features/preaching/SermonPreparationStudyReadinessGuard";
import { SermonTeachingFoundationSection } from "../../src/features/preaching/SermonTeachingFoundationSection";

interface PreachingPageProps {
    searchParams: Promise<{ studyId?: string }>;
}

export default async function PreachingPage({ searchParams }: PreachingPageProps) {
    const params = await searchParams;
    const studyId = params.studyId ?? "";

    return <>
        <SermonPreparationStudyReadinessGuard studyId={studyId} />
        <SermonTeachingFoundationSection />
        <SermonPreparationWorkspace />
        {studyId && <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 24px" }}>
            <Link href={`/preaching/exposition?studyId=${encodeURIComponent(studyId)}`} style={{ color: "#1d4ed8", fontWeight: 600, textDecoration: "none" }}>
                Continue to Sermon Exposition →
            </Link>
        </div>}
    </>;
}
