import { TeachingWorkspace } from "../../src/features/teaching/TeachingWorkspace";

export default async function TeachingPage({ searchParams }: { searchParams: Promise<{ studyId?: string }> }) {
    const params = await searchParams;
    return (
        <div className="bsmp-teaching-mobile-shell">
            <style>{`@media (max-width:700px){
.bsmp-teaching-mobile-shell{min-width:0;overflow:hidden}
.bsmp-teaching-mobile-shell *{max-width:100%;box-sizing:border-box;overflow-wrap:anywhere}
.bsmp-teaching-mobile-shell input:not([type="checkbox"]),.bsmp-teaching-mobile-shell textarea,.bsmp-teaching-mobile-shell select{width:100%;max-width:100%}
.bsmp-teaching-mobile-shell input[type="checkbox"]{flex:0 0 auto;margin-top:3px}
.bsmp-teaching-mobile-shell button{max-width:100%}
}`}</style>
            <TeachingWorkspace studyId={params.studyId ?? ""} />
        </div>
    );
}
