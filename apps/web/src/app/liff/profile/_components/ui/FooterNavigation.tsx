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

  // シンプルな単色バー [SF][DRY]
  // 閾値設定（今後変更可能）
  const THRESHOLD_GRAY = 25   // 0-25%: グレー
  const THRESHOLD_BLUE = 80   // 25-80%: 薄い青
  // 80%以上: 緑

  const COLOR_GRAY = '#9ca3af'
  const COLOR_BLUE = '#60a5fa'   // 薄い青
  const COLOR_GREEN = '#22c55e'

  // 完成度に応じてバー全体の色を決定
  const getProgressColor = (rate: number): string => {
    if (rate >= THRESHOLD_BLUE) return COLOR_GREEN  // 80%以上: 緑
    if (rate >= THRESHOLD_GRAY) return COLOR_BLUE   // 25-80%: 薄い青
    return COLOR_GRAY                                // 0-25%: グレー
  }

  const progressColor = getProgressColor(clampedRate)

  // 数字の色もバーと同じ色に
  const progressTextClass = clampedRate >= THRESHOLD_BLUE
    ? 'text-emerald-500'
    : clampedRate >= THRESHOLD_GRAY
      ? 'text-blue-400'
      : 'text-slate-400'

  return (
    <div
      className="fixed left-0 right-0 bg-background z-[60]"
      style={{ bottom: bottomOffset }}
    >
      <div className="container max-w-2xl mx-auto px-4 py-4">
        <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-100 text-foreground shadow-2xl px-5 py-6 space-y-4 transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 ease-out rounded-full"
                style={{ 
                  width: `${clampedRate}%`, 
                  backgroundColor: progressColor 
                }}
              />
            </div>
            <span className={`text-sm font-semibold min-w-[3ch] text-right ${progressTextClass}`}>
              {clampedRate}%
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
