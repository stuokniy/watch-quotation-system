import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Ban, Search, Upload, Watch } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
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

          <div className="flex flex-col gap-4 justify-center">
            <Link href="/upload">
              <Button size="lg" className="w-full sm:w-auto">
                開始使用
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-16">
            <Card>
              <CardHeader>
                <Upload className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>智能解析</CardTitle>
                <CardDescription>
                  上傳 WhatsApp 聊天記錄，自動提取手錶型號、價格和保卡日期
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/upload">
                  <Button variant="outline" className="w-full">
                    前往上傳
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Search className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>快速搜索</CardTitle>
                <CardDescription>
                  按型號搜索報價，比較不同報價人的價格，一鍵聯繫
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/search">
                  <Button variant="outline" className="w-full">
                    開始搜索
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Ban className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>黑名單管理</CardTitle>
                <CardDescription>
                  屏蔽不喜歡的號碼，自動從搜索結果中過濾
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/blacklist">
                  <Button variant="outline" className="w-full">
                    管理黑名單
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Activity className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>同步監控</CardTitle>
                <CardDescription>
                  實時監控 WhatsApp 自動同步狀態，查看報價更新
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/sync">
                  <Button variant="outline" className="w-full">
                    查看監控
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 p-8 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              系統已就緒
            </h2>
            <p className="text-slate-600 mb-4">
              您的手錶報價管理系統已成功部署。點擊上方按鈕開始使用各項功能。
            </p>
            <p className="text-sm text-slate-500">
              系統支持 WhatsApp 聊天記錄上傳、自動解析、報價搜索和黑名單管理。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
