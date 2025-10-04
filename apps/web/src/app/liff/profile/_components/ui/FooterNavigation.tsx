import { Button } from '@/shared/ui/button'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { STEPS } from '../constants'
import { BOTTOM_NAV_HEIGHT } from '../../../_components/BottomNav'

interface FooterNavigationProps {
  currentStep: number
  onPrev: () => void
  onNext: () => void
  onSubmit: () => void
  isBasicInfoValid: boolean
  completionRate: number
  saving?: boolean
}
export function FooterNavigation({
  currentStep,
  onPrev,
  onNext,
  onSubmit,
  isBasicInfoValid,
  completionRate,
  saving = false
}: FooterNavigationProps) {
  const bottomOffset = `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom) + 16px)`

  const clampedRate = Math.max(0, Math.min(100, completionRate))
  const total = clampedRate > 0 ? clampedRate : 1
  const baseGray = Math.min(clampedRate, 60)
  const yellowRange = clampedRate > 60 ? Math.min(clampedRate, 80) - 60 : 0
  const greenRange = clampedRate > 80 ? clampedRate - 80 : 0

  const toPercent = (value: number) => `${Math.min(100, Math.max(0, Number(value.toFixed(2))))}%`

  const grayPercent = (baseGray / total) * 100
  const yellowPercent = (yellowRange / total) * 100
  const greenPercent = (greenRange / total) * 100

  const gradientStops: string[] = [
    `#9ca3af 0%`,
    `#9ca3af ${toPercent(grayPercent)}`
  ]

  if (yellowPercent > 0) {
    const yellowStart = grayPercent
    const yellowEnd = grayPercent + yellowPercent
    gradientStops.push(`#facc15 ${toPercent(yellowStart)}`, `#facc15 ${toPercent(yellowEnd)}`)
  }

  if (greenPercent > 0) {
    const greenStart = grayPercent + yellowPercent
    gradientStops.push(`#22c55e ${toPercent(greenStart)}`, `#22c55e 100%`)
  } else {
    gradientStops.push(`${yellowPercent > 0 ? '#facc15' : '#9ca3af'} 100%`)
  }

  const progressGradient = `linear-gradient(90deg, ${gradientStops.join(', ')})`

  const progressTextClass = clampedRate >= 80
    ? 'text-emerald-500'
    : clampedRate >= 60
      ? 'text-amber-500'
      : 'text-slate-400'

  return (
    <div
      className="fixed left-0 right-0 bg-background z-[60]"
      style={{ bottom: bottomOffset }}
    >
      <div className="container max-w-2xl mx-auto px-4 py-4">
        <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-100 text-foreground shadow-2xl px-5 py-6 space-y-4 transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-border/60 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{ width: `${completionRate}%`, background: progressGradient }}
              />
            </div>
            <span className={`text-sm font-semibold min-w-[3ch] text-right ${progressTextClass}`}>
              {completionRate}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            disabled={currentStep === 1}
            className="flex-1 sm:flex-none bg-white text-black hover:bg-white/90"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              variant="outline"
              onClick={onNext}
              className="flex-1 sm:flex-none bg-white text-black hover:bg-white/90"
              disabled={(currentStep === 2 && !isBasicInfoValid) || saving}
            >
              {saving ? '保存中...' : '次へ'}
              {!saving && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onSubmit}
              className="flex-1 sm:flex-none bg-white text-black hover:bg-white/90"
              disabled={saving}
            >
              {saving ? '保存中...' : '登録完了'}
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
        
        {/* 保存の説明 */}
        {currentStep < STEPS.length && (
          <p className="text-xs text-muted-foreground text-center">
            次へをタップで保存されます
          </p>
        )}
        </div>
      </div>
    </div>
  )
}
