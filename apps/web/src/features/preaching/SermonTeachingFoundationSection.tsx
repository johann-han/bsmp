"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ExpositorySermon } from "@bsmp/preaching";
import { SupabaseExpositorySermonRepository } from "../../lib/SupabaseExpositorySermonRepository";
import { TeachingSermonBridge } from "./TeachingSermonBridge";

export function SermonTeachingFoundationSection() {
    const searchParams = useSearchParams();
    const studyId = searchParams.get("studyId") ?? "";
    const [sermon, setSermon] = useState<ExpositorySermon | null>(null);

    useEffect(() => {
        let active = true;
        if (!studyId) { setSermon(null); return () => { active = false; }; }
        void new SupabaseExpositorySermonRepository().findByStudyId(studyId).then((loaded) => {
            if (active) setSermon(loaded ?? null);
        }).catch(() => {
            if (active) setSermon(null);
        });
        return () => { active = false; };
    }, [studyId]);

    if (!studyId || !sermon) return null;
    return <TeachingSermonBridge studyId={studyId} sermon={sermon} onLinked={() => void new SupabaseExpositorySermonRepository().findByStudyId(studyId).then((loaded) => setSermon(loaded ?? null))} />;
}
