import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Users, Clock, MapPin, FileText } from "lucide-react"

// サンプルデータ（実際はAPIやデータベースから取得）
const auditionDetails = {
  "1": {
    id: "1",
    title: "2025年春季ドラマ主演オーディション",
    date: "2025年4月15日",
    recruitCount: 5,
    category: "ドラマ",
    deadline: "2025年3月31日",
    location: "東京都渋谷区 スタジオA",
    description: "2025年春季放送予定の連続ドラマの主演キャストを募集します。情熱的で演技力のある方を求めています。",
    requirements: ["18歳以上30歳以下", "演技経験1年以上", "撮影期間中のスケジュール確保が可能な方"],
    schedule: "第一次審査: 書類選考\n第二次審査: 実技審査\n最終審査: 監督面接",
  },
}

export default async function AuditionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const audition = auditionDetails[id as keyof typeof auditionDetails] || {
    id: id,
    title: "オーディション詳細",
    date: "2025年4月15日",
    recruitCount: 5,
    category: "未分類",
    deadline: "2025年3月31日",
    location: "東京都",
    description: "オーディションの詳細情報です。",
    requirements: ["詳細は後日公開"],
    schedule: "詳細は後日公開",
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              一覧に戻る
            </Link>
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-3">
                {audition.category}
              </Badge>
              <h1 className="text-3xl font-bold text-foreground mb-2">{audition.title}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: 詳細情報 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  オーディション概要
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground leading-relaxed">{audition.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>応募条件</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {audition.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-foreground">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>選考スケジュール</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-line leading-relaxed">{audition.schedule}</p>
              </CardContent>
            </Card>
          </div>

          {/* 右側: サマリー情報 */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">開催情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">開催日</p>
                      <p className="font-semibold text-foreground">{audition.date}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">応募締切</p>
                      <p className="font-semibold text-foreground">{audition.deadline}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">募集人数</p>
                      <p className="font-semibold text-foreground">{audition.recruitCount}名</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">開催場所</p>
                      <p className="font-semibold text-foreground">{audition.location}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <Button className="w-full" size="lg">
                    応募する
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    お気に入りに追加
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
