import { AppShell } from "@repo/ui";

import { ObservationWorkspace } from "../../src/features/observation";
import { StudyWorkspaceAnchorResolver } from "../../src/features/observation/StudyWorkspaceAnchorResolver";

export default function WorkspacePage() {
    return (
        <AppShell title="Study Workspace">
            <StudyWorkspaceAnchorResolver />
            <ObservationWorkspace />
        </AppShell>
    );
}
