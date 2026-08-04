import { AppShell } from "@repo/ui";

export default function HomePage() {

  return (

    <AppShell title="Dashboard">

      <div className="space-y-6">

        <div className="rounded-lg bg-white p-6 shadow">

          <h2 className="text-xl font-semibold">
            Welcome to BSMP
          </h2>

          <p className="mt-2 text-slate-600">
            Bible Study Ministry Platform
          </p>

        </div>

        <div className="grid grid-cols-3 gap-6">

          <div className="rounded-lg bg-white p-6 shadow">
            Recent Studies
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            Continue Study
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            Bible Reading
          </div>

        </div>

      </div>

    </AppShell>

  );

}