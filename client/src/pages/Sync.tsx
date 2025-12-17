import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertCircle, CheckCircle2, Clock, MessageSquare, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: string | null;
  stats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    messagesProcessed: number;
    quotationsFound: number;
  };
  config: {
    syncInterval: number;
    groups: string[];
  };
}

export default function Sync() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // 在實際應用中，這會調用後端 API
        // 目前顯示示例數據
        setStatus({
          isRunning: true,
          lastSyncTime: new Date().toISOString(),
          stats: {
            totalSyncs: 42,
            successfulSyncs: 40,
            failedSyncs: 2,
            messagesProcessed: 1250,
            quotationsFound: 156,
          },
          config: {
            syncInterval: 60000,
            groups: [
              "120363123456789@g.us",
              "120363987654321@g.us",
            ],
          },
        });
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch status");
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // 每 10 秒刷新一次
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "未同步";
    const date = new Date(dateString);
    return date.toLocaleString("zh-HK");
  };

  const successRate = status
    ? ((status.stats.successfulSyncs / status.stats.totalSyncs) * 100).toFixed(1)
    : "0";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-4 text-slate-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">同步監控</h1>
            <p className="text-slate-600 mt-2">WhatsApp 聊天記錄自動同步狀態</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${status?.isRunning ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
            <span className="text-sm font-medium text-slate-700">
              {status?.isRunning ? "運行中" : "已停止"}
            </span>
          </div>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {status && (
          <>
            {/* 狀態卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">總同步次數</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{status.stats.totalSyncs}</div>
                  <p className="text-xs text-slate-500 mt-1">自啟動以來</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">成功率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{successRate}%</div>
                  <p className="text-xs text-slate-500 mt-1">{status.stats.successfulSyncs}/{status.stats.totalSyncs}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">消息已處理</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{status.stats.messagesProcessed}</div>
                  <p className="text-xs text-slate-500 mt-1">條消息</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">報價已提取</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{status.stats.quotationsFound}</div>
                  <p className="text-xs text-slate-500 mt-1">條報價</p>
                </CardContent>
              </Card>
            </div>

            {/* 詳細信息 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 同步信息 */}
              <Card>
                <CardHeader>
                  <CardTitle>同步信息</CardTitle>
                  <CardDescription>實時同步狀態</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">狀態</span>
                    <Badge className={status.isRunning ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {status.isRunning ? "運行中" : "已停止"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">最後同步時間</span>
                    <span className="text-sm font-medium text-slate-900">
                      {formatDate(status.lastSyncTime)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">同步間隔</span>
                    <span className="text-sm font-medium text-slate-900">
                      {status.config.syncInterval / 1000} 秒
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">監聽群組數</span>
                    <span className="text-sm font-medium text-slate-900">
                      {status.config.groups.length} 個
                    </span>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-slate-500 mb-3">同步統計</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-slate-600">成功: {status.stats.successfulSyncs}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-slate-600">失敗: {status.stats.failedSyncs}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 監聽群組 */}
              <Card>
                <CardHeader>
                  <CardTitle>監聽群組</CardTitle>
                  <CardDescription>正在監聽的 WhatsApp 群組</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {status.config.groups.length > 0 ? (
                      status.config.groups.map((groupId, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-200"
                        >
                          <Activity className="h-4 w-4 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">群組 {index + 1}</p>
                            <p className="text-xs text-slate-500 font-mono break-all">{groupId}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">活躍</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">未配置任何群組</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 使用說明 */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">如何配置自動同步？</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 space-y-3">
                <p>
                  <strong>1. 啟動同步工具</strong>
                </p>
                <pre className="bg-white p-3 rounded border border-blue-200 overflow-x-auto text-xs">
                  {`node tools/whatsapp-sync-tool.mjs start`}
                </pre>

                <p>
                  <strong>2. 掃描二維碼登錄 WhatsApp</strong>
                </p>

                <p>
                  <strong>3. 配置要監聽的群組</strong>
                </p>
                <pre className="bg-white p-3 rounded border border-blue-200 overflow-x-auto text-xs">
                  {`node tools/whatsapp-sync-tool.mjs set-groups "120363123456789@g.us" "120363987654321@g.us"`}
                </pre>

                <p>
                  <strong>4. 查看同步狀態</strong>
                </p>
                <pre className="bg-white p-3 rounded border border-blue-200 overflow-x-auto text-xs">
                  {`node tools/whatsapp-sync-tool.mjs status`}
                </pre>

                <p className="text-xs text-blue-700 mt-4">
                  工具將每分鐘自動導出 WhatsApp 聊天記錄並上傳到系統，自動解析報價信息。
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
