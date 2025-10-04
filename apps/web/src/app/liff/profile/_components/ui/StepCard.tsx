import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { STEPS } from '../constants'

interface StepCardProps {
  currentStep: number
  children: React.ReactNode
}

export function StepCard({ currentStep, children }: StepCardProps) {
  const currentStepConfig = STEPS[currentStep - 1]
  
  if (!currentStepConfig) return null

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 flex-shrink-0">
            {React.createElement(currentStepConfig.icon, { className: 'w-6 h-6 text-blue-600' })}
          </div>
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold mb-1">{currentStepConfig.name}</CardTitle>
            <CardDescription className="text-base text-muted-foreground mb-2">
              {currentStepConfig.description}
            </CardDescription>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                ステップ {currentStep} / {STEPS.length}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <form className="space-y-6">
          {children}
        </form>
      </CardContent>
    </Card>
  )
}
