import React from 'react'
import { STEPS } from '../constants'

interface StepNavigationProps {
  currentStep: number
  onStepClick: (stepId: number) => void
  isBasicInfoValid: boolean
}

export function StepNavigation({ currentStep, onStepClick, isBasicInfoValid }: StepNavigationProps) {
  return (
    <div className="bg-card border-b border-border">
      <div className="container max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            const isVisited = currentStep >= step.id
            const isDisabled = step.id > 2 && !isBasicInfoValid
            const isGuideStep = step.id === 1
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <button
                    type="button"
                    onClick={() => onStepClick(step.id)}
                    disabled={isDisabled}
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                      isGuideStep
                        ? 'bg-green-500 border-green-500 text-white cursor-pointer hover:bg-green-600'
                        : isActive
                          ? 'bg-blue-500 border-blue-500 text-white cursor-pointer hover:bg-blue-600 shadow-lg ring-2 ring-blue-300'
                          : isCompleted
                            ? 'bg-foreground border-foreground text-background cursor-pointer hover:opacity-80'
                            : isDisabled
                              ? 'bg-background border-border text-muted-foreground cursor-not-allowed'
                              : 'bg-background border-border text-muted-foreground cursor-pointer hover:border-foreground/50'
                    } ${!isDisabled ? 'active:scale-95' : ''}`}
                    aria-label={`${step.name}に移動`}
                  >
                    {step.label === 'Eye' ? (
                      <Icon className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{step.label}</span>
                    )}
                  </button>
                </div>
                {index < STEPS.length - 1 && <div className="h-0.5 bg-border flex-1 max-w-4" />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
