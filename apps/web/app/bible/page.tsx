import { AppShell } from "@repo/ui";

import { BibleReader } from "../../src/features/bible/BibleReader";

export default function BiblePage() {
    return (
        <AppShell title="Bible">
            <BibleReader />
        </AppShell>
    );
}
