import { interpretChannels, type ChannelCode, type MarginResult } from '../engine'

type ChannelInsightPanelProps = {
  rows: MarginResult[]
  activeChannel: ChannelCode
}

export function ChannelInsightPanel({ rows, activeChannel }: ChannelInsightPanelProps) {
  const insight = interpretChannels(rows, activeChannel)
  if (!insight) return null

  return (
    <div className="mt-4 rounded-2xl border border-line bg-canvas p-4">
      <p className="text-sm font-semibold">{insight.headline}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{insight.body}</p>
      {insight.actions.length ? (
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-subtle">
          {insight.actions.map((action) => (
            <li key={action}>· {action}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
