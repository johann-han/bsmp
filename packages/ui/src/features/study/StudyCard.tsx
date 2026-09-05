import Link from "next/link";

import { Badge, Card } from "../..";

interface StudyCardProps {
    id: string;
    title: string;
    passage: string;
    status: string;
}

export function StudyCard({
    id,
    title,
    passage,
    status,
}: StudyCardProps) {
    return (
        <Link href={`/workspace?studyId=${encodeURIComponent(id)}`} className="block no-underline">
            <Card>
                <div className="flex justify-between">
                    <div>
                        <h3>{title}</h3>
                        <p>{passage}</p>
                    </div>
                    <Badge>{status}</Badge>
                </div>
            </Card>
        </Link>
    );
}
