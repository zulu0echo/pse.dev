"use client"

/** Score bar with gradient: 0 = red, 100 = green */
export function GradientScoreBar({
  value,
  max = 100,
}: {
  value: number
  max?: number
}) {
  const num = Number(value)
  const numMax = Number(max) || 100
  const pct = Number.isFinite(num)
    ? Math.min(100, Math.max(0, Math.round((num / numMax) * 100)))
    : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 min-w-[4rem] flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, rgb(239 68 68), rgb(34 197 94))",
          }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
        {Number.isFinite(num) ? num : 0}
      </span>
    </div>
  )
}
