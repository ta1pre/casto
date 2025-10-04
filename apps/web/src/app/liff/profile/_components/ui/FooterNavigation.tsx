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

  return (
    <div
      className="fixed left-0 right-0 bg-black border-t border-border z-40 shadow-lg"
      style={{ bottom: bottomOffset }}
    >
      <div className="container max-w-2xl mx-auto px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-border/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-white min-w-[3ch] text-right">
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
          <p className="text-xs text-white/60 text-center">
            次へをタップで保存されます
          </p>
        )}
      </div>
    </div>
  )
}
