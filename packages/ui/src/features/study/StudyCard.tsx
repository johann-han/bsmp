import { Badge, Card } from "../..";

interface StudyCardProps {
    title: string;
    passage: string;
    status: string;
}

export function StudyCard({
    title,
    passage,
    status,
}: StudyCardProps) {

    return (

        <Card>

            <div className="flex justify-between">

                <h3>Romans 8 Study</h3>

                <Badge>Draft</Badge>

            </div>

        </Card>

    );

}