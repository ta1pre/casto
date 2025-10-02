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
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
            {React.createElement(currentStepConfig.icon, { className: 'w-5 h-5 text-foreground' })}
          </div>
          <div>
            <CardTitle className="text-2xl">{currentStepConfig.name}</CardTitle>
            <CardDescription>
              ステップ {currentStep} / {STEPS.length}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          {children}
        </form>
      </CardContent>
    </Card>
  )
}
