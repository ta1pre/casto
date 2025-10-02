interface ProfileCompletionCardProps {
  completionRate: number
}

export function ProfileCompletionCard({ completionRate }: ProfileCompletionCardProps) {
  const getCompletionGradient = () => {
    if (completionRate < 30) return 'bg-gradient-to-r from-red-600 to-red-400'
    if (completionRate < 70) return 'bg-gradient-to-r from-yellow-600 to-yellow-400'
    return 'bg-gradient-to-r from-green-600 to-green-400'
  }

  return (
    <div className="bg-gradient-to-b from-secondary/30 to-card border-b border-border">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-border/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">プロフィール完成度</span>
              <span className="font-bold text-lg text-foreground">{completionRate}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-500 ease-out ${getCompletionGradient()}`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
