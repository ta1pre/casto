import { Button } from '@/shared/ui/button'
import { OVERVIEW_SECTIONS } from '../constants'

interface OverviewStepProps {
  onStepClick: (step: number) => void
}

export function OverviewStep({ onStepClick }: OverviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <p className="text-muted-foreground">
          これから入力する項目の全体像です。各セクションから入力を始めましょう。
        </p>
      </div>
      <div className="space-y-3">
        {OVERVIEW_SECTIONS.map((section) => (
          <Button
            key={section.step}
            type="button"
            variant="outline"
            className="w-full justify-start h-auto py-4 px-4"
            onClick={() => onStepClick(section.step)}
          >
            <div className="text-left">
              <div className="font-semibold">{section.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{section.desc}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}
