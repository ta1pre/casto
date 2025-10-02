import { Button } from '@/shared/ui/button'
import { Camera } from 'lucide-react'

export function PhotoStep() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
        <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-4">
          顔写真と全身写真をアップロードします
        </p>
        <Button type="button" variant="outline" disabled>
          写真をアップロード（実装予定）
        </Button>
      </div>
    </div>
  )
}
