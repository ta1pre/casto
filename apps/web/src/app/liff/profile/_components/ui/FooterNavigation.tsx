import { Button } from '@/shared/ui/button'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { STEPS } from '../constants'

interface FooterNavigationProps {
  currentStep: number
  onPrev: () => void
  onNext: () => void
  onSubmit: () => void
  isBasicInfoValid: boolean
  completionRate: number
}
export function FooterNavigation({
  currentStep,
  onPrev,
  onNext,
  onSubmit,
  isBasicInfoValid,
  completionRate
}: FooterNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-border z-40">
      <div className="container max-w-2xl mx-auto px-4 py-4 space-y-4">
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
              disabled={currentStep === 2 && !isBasicInfoValid}
            >
              次へ
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onSubmit}
              className="flex-1 sm:flex-none bg-white text-black hover:bg-white/90"
            >
              登録完了
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
