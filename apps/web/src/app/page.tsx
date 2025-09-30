import { AuditionCard } from "@/components/audition-card"
import { Calendar, Users } from "lucide-react"

// サンプルデータ
const auditions = [
  {
    id: "1",
    title: "2025年春季ドラマ主演オーディション",
    date: "2025年4月15日",
    recruitCount: 5,
    category: "ドラマ",
    deadline: "2025年3月31日",
  },
  {
    id: "2",
    title: "新人アイドルグループメンバー募集",
    date: "2025年5月20日",
    recruitCount: 10,
    category: "音楽",
    deadline: "2025年4月15日",
  },
  {
    id: "3",
    title: "映画「夏の約束」キャスト募集",
    date: "2025年6月10日",
    recruitCount: 3,
    category: "映画",
    deadline: "2025年5月25日",
  },
  {
    id: "4",
    title: "ミュージカル「星降る夜に」出演者オーディション",
    date: "2025年7月5日",
    recruitCount: 8,
    category: "舞台",
    deadline: "2025年6月20日",
  },
  {
    id: "5",
    title: "CMタレント募集 - 大手飲料メーカー",
    date: "2025年4月25日",
    recruitCount: 2,
    category: "CM",
    deadline: "2025年4月10日",
  },
  {
    id: "6",
    title: "バラエティ番組レギュラー出演者募集",
    date: "2025年5月15日",
    recruitCount: 4,
    category: "バラエティ",
    deadline: "2025年4月30日",
  },
]

export default function AuditionsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">オーディション一覧</h1>
          <p className="text-muted-foreground mt-2">あなたの夢を叶えるチャンスを見つけよう</p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">開催予定</p>
                <p className="text-2xl font-bold text-foreground">{auditions.length}件</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">総募集人数</p>
                <p className="text-2xl font-bold text-foreground">
                  {auditions.reduce((sum, a) => sum + a.recruitCount, 0)}名
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-border rounded-lg p-6">
            <div>
              <p className="text-sm text-muted-foreground">新着オーディション</p>
              <p className="text-2xl font-bold text-foreground">3件</p>
              <p className="text-xs text-muted-foreground mt-1">過去7日間</p>
            </div>
          </div>
        </div>

        {/* オーディションカードグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auditions.map((audition) => (
            <AuditionCard key={audition.id} audition={audition} />
          ))}
        </div>
      </main>
    </div>
  )
}
