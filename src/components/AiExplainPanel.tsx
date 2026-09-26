import { useMemo } from 'react'
import { sensitivityAnalysis, type ChannelCode, type MarginInput, type MarginResult } from '../engine'
import { buildAiExplanation, previewAiExplanation } from '../pro/aiExplain'
import { isProActive, type ProSession } from '../pro/accountStorage'

type AiExplainPanelProps = {
  session: ProSession | null
  input: MarginInput
  result: MarginResult
  channelRows: MarginResult[]
  activeChannel: ChannelCode
}

export function AiExplainPanel({ session, input, result, channelRows, activeChannel }: AiExplainPanelProps) {
  const sensitivityRows = useMemo(() => sensitivityAnalysis(input), [input])
  const ctx = useMemo(
    () => ({ input, result, channelRows, activeChannel, sensitivityRows }),
    [input, result, channelRows, activeChannel, sensitivityRows],
  )
  const proActive = isProActive(session)
  const fullExplanation = useMemo(() => buildAiExplanation(ctx), [ctx])
  const preview = useMemo(() => previewAiExplanation(ctx), [ctx])
  const explanation = proActive ? fullExplanation : preview

  return (
    <div className="mt-4 rounded-3xl border border-line bg-paper p-6" data-testid="ai-explain-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-kicker">PRO · AI EXPLAIN</p>
          <h3 className="mt-1 panel-title">AI 설명 레이어</h3>
          <p className="mt-1 text-help">계산은 엔진, 설명만 AI 레이어가 읽어 정리합니다. 숫자를 새로 만들지 않습니다.</p>
        </div>
        {!proActive ? <span className="rounded-full border border-line px-3 py-1 text-xs font-medium text-subtle">Pro 체험 필요</span> : null}
      </div>

      <p className="mt-4 rounded-2xl bg-canvas p-4 text-sm leading-relaxed text-ink-2">{explanation.summary}</p>

      <div className="mt-4 space-y-4">
        {explanation.sections.map((section) => (
          <section key={section.title} className="rounded-2xl border border-line p-4">
            <h4 className="text-sm font-semibold">{section.title}</h4>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
            {section.bullets.length ? (
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-muted">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>· {bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      {proActive ? (
        <div className="mt-4 rounded-2xl border border-line bg-canvas p-4">
          <p className="text-sm font-semibold">다음 행동</p>
          <ul className="mt-2 space-y-1 text-sm leading-relaxed text-muted">
            {fullExplanation.followUps.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
          <p className="mt-3 text-help">{fullExplanation.disclaimer}</p>
        </div>
      ) : (
        <p className="mt-4 text-help">Pro 체험 로그인 후 채널 전략·민감도·다음 행동까지 전체 AI 설명을 볼 수 있습니다.</p>
      )}
    </div>
  )
}
