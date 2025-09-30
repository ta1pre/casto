import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Clock } from "lucide-react"

interface Audition {
  id: string
  title: string
  date: string
  recruitCount: number
  category: string
  deadline: string
}

interface AuditionCardProps {
  audition: Audition
}

export function AuditionCard({ audition }: AuditionCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 flex flex-col h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="text-xs">
            {audition.category}
          </Badge>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            締切: {audition.deadline}
          </Badge>
        </div>
        <h3 className="text-lg font-bold text-card-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {audition.title}
        </h3>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium">開催日</span>
            </div>
            <span className="text-foreground font-semibold">{audition.date}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4 text-accent" />
              <span className="font-medium">募集人数</span>
            </div>
            <span className="text-foreground font-semibold">{audition.recruitCount}名</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">応募締切まで残りわずか。詳細をご確認ください。</p>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Link href={`/auditions/${audition.id}`}>詳細を見る</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
