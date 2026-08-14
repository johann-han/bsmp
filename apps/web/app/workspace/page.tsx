import { AppShell } from "@repo/ui";

import { ObservationWorkspace } from "../../src/features/observation";

export default function WorkspacePage() {
    return (
        <AppShell title="Study Workspace">
            <ObservationWorkspace />
        </AppShell>
    );
}
