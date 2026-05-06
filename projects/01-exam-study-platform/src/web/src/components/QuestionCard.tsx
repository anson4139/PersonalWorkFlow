import type { Question } from '../types'

interface Props {
  question: Question
  index: number
  total: number
  revealAnswer?: boolean
  selectedOption?: string | null
  onSelectOption?: (option: 'A' | 'B' | 'C' | 'D') => void
  disableSelection?: boolean
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const

function formatExplanation(text: string) {
  let formatted = text
  const fractionPattern = /\\frac\{([^{}]+)\}\{([^{}]+)\}/g

  while (fractionPattern.test(formatted)) {
    formatted = formatted.replace(fractionPattern, '($1)/($2)')
  }

  return formatted
    .replace(/\\times/g, '×')
    .replace(/\\approx/g, '≈')
    .replace(/\\ln/g, 'ln')
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\%/g, '%')
    .replace(/\\ /g, '')
}

export default function QuestionCard({
  question,
  index,
  total,
  revealAnswer = true,
  selectedOption = null,
  onSelectOption,
  disableSelection = false,
}: Props) {
  const explanation = formatExplanation(question.explanation)
  const isSelectable = Boolean(onSelectOption)

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-5">
      {/* 題號 */}
      <p className="mb-3 text-xs text-gray-600">
        第 {index} / {total} 題
      </p>

      {/* 題目 */}
      <p className="mb-5 text-base font-medium leading-relaxed text-gray-100">
        {question.no}. {question.question}
      </p>

      {/* 選項 */}
      <div className="mb-5 space-y-2">
        {OPTIONS.map(opt => {
          const text = question.options[opt]
          if (!text) return null
          const isAnswer = opt === question.answer
          const isSelected = selectedOption === opt

          let optionClass = 'border-[#1f1f1f] bg-[#0a0a0a] text-gray-400'
          if (revealAnswer) {
            if (isAnswer) {
              optionClass = 'border-[#76b900] bg-[#0d1a00] text-[#76b900] font-semibold'
            } else if (isSelected) {
              optionClass = 'border-red-500/60 bg-red-950/40 text-red-300'
            }
          } else if (isSelected) {
            optionClass = 'border-[#76b900] bg-[#0f1900] text-[#b9ef65] font-semibold'
          }

          if (!isSelectable) {
            return (
              <div
                key={opt}
                className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${optionClass}`}
              >
                ({opt}) {text}
              </div>
            )
          }

          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelectOption?.(opt)}
              disabled={disableSelection}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm leading-relaxed transition ${optionClass} ${disableSelection ? 'cursor-not-allowed opacity-80' : 'hover:border-[#76b900] hover:text-white'}`}
            >
              ({opt}) {text}
            </button>
          )
        })}
      </div>

      {/* 說明 */}
      {revealAnswer && question.explanation && question.explanation !== 'PDF 原始試題未附解析' && (
        <details className="rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-[#76b900]">
            查看解析
          </summary>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-400">
            {explanation}
          </p>
        </details>
      )}
    </div>
  )
}
