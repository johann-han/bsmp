import { AppShell } from "@repo/ui";

import { GlobalNav } from "../../src/components/GlobalNav";
import { ObservationWorkspace } from "../../src/features/observation";

export default function WorkspacePage() {
    return (
        <>
            <GlobalNav />
            <AppShell title="Study Workspace">
                <ObservationWorkspace />
            </AppShell>
        </>
    );
}
