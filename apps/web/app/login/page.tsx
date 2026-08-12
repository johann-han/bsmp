import { Suspense } from "react";
import { AuthForm } from "../../src/features/auth";

export default function LoginPage() {
    return (
        <main style={{ padding: 32 }}>
            <Suspense fallback={<p>Loading sign-in...</p>}>
                <AuthForm />
            </Suspense>
        </main>
    );
}