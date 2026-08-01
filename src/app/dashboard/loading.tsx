const skeletonPulse = {
  background: "#ece8dd",
  animation: "dashboard-skeleton-pulse 1.4s ease-in-out infinite",
} as const;

function SkeletonBar({ className }: { className: string }) {
  return (
    <div
      className={`dashboard-skeleton-bar rounded-sm ${className}`}
      style={skeletonPulse}
      aria-hidden="true"
    />
  );
}

function SkeletonRow() {
  return (
    <li
      className="rounded border px-7 py-6"
      style={{
        borderColor: "var(--sc-rule)",
        background: "var(--sc-panel)",
        boxShadow: "var(--sc-shadow)",
      }}
      aria-hidden="true"
    >
      <SkeletonBar className="mb-3 h-[26px] max-w-[280px]" />
      <SkeletonBar className="h-[13px] max-w-[140px]" />
    </li>
  );
}

export default function DashboardLoading() {
  return (
    <main
      className="rounded px-8 py-10"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      <style>{`
        @keyframes dashboard-skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dashboard-skeleton-bar {
            animation: none !important;
          }
        }
      `}</style>
      <span className="sr-only">Loading your sermons</span>
      <div className="mt-12 mb-6" aria-hidden="true">
        <SkeletonBar className="mb-3 h-[11px] w-24" />
        <SkeletonBar className="h-8 max-w-[200px]" />
      </div>
      <ul className="flex flex-col gap-4">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </ul>
    </main>
  );
}
