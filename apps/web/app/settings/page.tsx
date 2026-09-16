import { AppShell } from "@repo/ui";
import { AccountSettings } from "../../src/features/auth/AccountSettings";

export default function SettingsPage() {
    return (
        <AppShell title="Settings">
            <AccountSettings />
        </AppShell>
    );
}
