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

                <div>

                    <h3>{title}</h3>

                    <p>{passage}</p>

                </div>

                <Badge>{status}</Badge>

            </div>

        </Card>

    );

}
