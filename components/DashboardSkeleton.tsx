function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-zinc-200 ${className}`} aria-hidden />;
}

function HeaderSkeleton() {
  return (
    <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-10 w-40 rounded-lg" />
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="h-4 w-72 max-w-[min(100vw-3rem,18rem)]" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-11 w-36 rounded-lg" />
        <SkeletonBlock className="h-11 w-32 rounded-lg" />
        <SkeletonBlock className="h-11 w-28 rounded-lg" />
      </div>
    </header>
  );
}

function KpiTileSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <SkeletonBlock className="h-4 w-28" />
      <SkeletonBlock className="mt-3 h-10 w-16" />
    </div>
  );
}

export function LeadCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock className="h-5 w-3/5 max-w-[14rem]" />
          <SkeletonBlock className="h-4 w-2/5 max-w-[10rem]" />
        </div>
        <SkeletonBlock className="h-8 w-20 shrink-0 rounded-full" />
      </div>
      <div className="space-y-2.5">
        <SkeletonBlock className="h-4 w-full max-w-[18rem]" />
        <SkeletonBlock className="h-4 w-4/5 max-w-[15rem]" />
        <SkeletonBlock className="h-4 w-3/5 max-w-[12rem]" />
      </div>
      <div className="mt-4 flex gap-2">
        <SkeletonBlock className="h-9 w-24 rounded-lg" />
        <SkeletonBlock className="h-9 w-24 rounded-lg" />
        <SkeletonBlock className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-100 text-zinc-900 xl:min-h-0 xl:flex-1 xl:overflow-hidden">
      <main className="mx-auto flex w-full max-w-[1600px] flex-col px-6 py-4 pb-8 md:px-12 md:py-5 xl:flex-1 xl:min-h-0 xl:overflow-hidden xl:pb-5">
        <HeaderSkeleton />

        <section className="mb-4 grid shrink-0 grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          <KpiTileSkeleton />
          <KpiTileSkeleton />
          <KpiTileSkeleton />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-2 xl:grid-rows-1 xl:gap-6 xl:overflow-hidden">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6 xl:flex xl:min-h-0 xl:flex-col">
            <SkeletonBlock className="mb-3 h-5 w-64 xl:shrink-0" />
            <div className="h-72 w-full shrink-0 xl:h-auto xl:min-h-0 xl:flex-1">
              <SkeletonBlock className="h-full min-h-[18rem] w-full rounded-xl" />
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6 xl:min-h-0">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
              <SkeletonBlock className="h-5 w-56" />
              <SkeletonBlock className="h-4 w-24" />
            </div>
            <div className="flex h-80 min-h-0 flex-col gap-3 overflow-hidden xl:h-auto xl:flex-1">
              <LeadCardSkeleton />
              <LeadCardSkeleton />
              <LeadCardSkeleton />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export function HistoryPageSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-100 text-zinc-900 xl:min-h-0 xl:flex-1 xl:overflow-hidden">
      <main className="mx-auto flex w-full max-w-[1600px] flex-col px-6 py-4 pb-8 md:px-12 md:py-5 xl:flex-1 xl:min-h-0 xl:overflow-hidden xl:pb-5">
        <HeaderSkeleton />

        <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
            <SkeletonBlock className="h-11 w-full max-w-sm rounded-xl" />
            <SkeletonBlock className="h-4 w-24" />
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-3 lg:grid-cols-2 lg:gap-4">
            <LeadCardSkeleton />
            <LeadCardSkeleton />
            <LeadCardSkeleton />
            <LeadCardSkeleton />
          </div>
        </section>
      </main>
    </div>
  );
}
