import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Activity, Ban, Search, Upload, Watch } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-4 text-slate-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-4">
                <Watch className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-slate-900">
                手錶報價管理系統
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                專為 B2B 手錶交易設計，從 WhatsApp 聊天記錄中智能提取報價信息，快速搜索比價，提升交易效率
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>立即開始</a>
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <Card>
                <CardHeader>
                  <Upload className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>智能解析</CardTitle>
                  <CardDescription>
                    上傳 WhatsApp 聊天記錄，自動識別手錶型號、價格、保卡日期和報價人信息
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Search className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>快速搜索</CardTitle>
                  <CardDescription>
                    按型號搜索所有報價，支持價格排序，一鍵 WhatsApp 聯繫報價人
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Ban className="h-8 w-8 text-red-600 mb-2" />
                  <CardTitle>黑名單管理</CardTitle>
                  <CardDescription>
                    屏蔽不喜歡的號碼，過濾搜索結果，只看想看的報價
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="mt-16 p-8 bg-slate-50 rounded-2xl text-left max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">主要功能</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>支持多文件批量上傳，一次處理多個聊天記錄</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>自動識別常見品牌型號（Rolex、Patek Philippe、Audemars Piguet 等）</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>支持多種貨幣格式（HKD、USD、CNY、EUR）</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>智能去重，避免重複報價</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>一鍵 WhatsApp 直連，快速聯繫報價人</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-slate-900">歡迎回來，{user?.name || '用戶'}</h1>
            <p className="text-slate-600">選擇下方功能開始使用</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/upload">
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle>上傳聊天記錄</CardTitle>
                  <CardDescription>
                    上傳 WhatsApp 導出的聊天記錄，自動提取報價信息
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    前往上傳
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/search">
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle>搜索報價</CardTitle>
                  <CardDescription>
                    按型號搜索所有報價，快速比價找到最優選擇
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    開始搜索
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/blacklist">
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Ban className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle>黑名單管理</CardTitle>
                  <CardDescription>
                    管理不希望看到報價的電話號碼
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    管理黑名單
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/sync">
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <Activity className="h-8 w-8 text-yellow-600" />
                  </div>
                  <CardTitle>同步監控</CardTitle>
                  <CardDescription>
                    查看自動同步狀態和統計信息
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    查看監控
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
