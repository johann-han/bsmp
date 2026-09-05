import { StudyCard } from "./StudyCard";

interface Study {
    id: string;
    title: string;
    passage: string;
    status: string;
}

interface StudyListProps {
    studies: readonly Study[];
}

export function StudyList({
    studies,
}: StudyListProps) {
    return (
        <div className="space-y-4">
            {studies.map((study) => (
                <StudyCard
                    key={study.id}
                    id={study.id}
                    title={study.title}
                    passage={study.passage}
                    status={study.status}
                />
            ))}
        </div>
    );
}
