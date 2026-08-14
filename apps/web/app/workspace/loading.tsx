export default function Loading() {
    return (
        <main className="min-h-screen bg-slate-100">
            <div className="mx-auto w-full max-w-[1800px] px-4 py-5 md:px-8 md:py-7">
                <div className="mb-6 h-8 w-56 animate-pulse rounded bg-slate-200" />

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-slate-200" />
                        <div className="space-y-3">
                            <div className="h-24 animate-pulse rounded bg-slate-100" />
                            <div className="h-24 animate-pulse rounded bg-slate-100" />
                            <div className="h-24 animate-pulse rounded bg-slate-100" />
                            <div className="h-24 animate-pulse rounded bg-slate-100" />
                        </div>
                    </section>

                    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-slate-200" />
                        <div className="space-y-3">
                            <div className="h-16 animate-pulse rounded bg-slate-100" />
                            <div className="h-16 animate-pulse rounded bg-slate-100" />
                            <div className="h-16 animate-pulse rounded bg-slate-100" />
                        </div>
                    </aside>
                </div>

                <p className="mt-4 text-sm text-slate-500">Loading your study workspace…</p>
            </div>
        </main>
    );
}
