import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Ban, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Blacklist() {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reason, setReason] = useState("");

  const utils = trpc.useUtils();
  const { data: blacklist, isLoading } = trpc.blacklist.list.useQuery();
  const addMutation = trpc.blacklist.add.useMutation({
    onSuccess: () => {
      utils.blacklist.list.invalidate();
      utils.quotations.search.invalidate();
      toast.success("已添加到黑名單");
      setOpen(false);
      setPhoneNumber("");
      setReason("");
    },
    onError: (error) => {
      toast.error("添加失敗：" + error.message);
    },
  });

  const removeMutation = trpc.blacklist.remove.useMutation({
    onSuccess: () => {
      utils.blacklist.list.invalidate();
      utils.quotations.search.invalidate();
      toast.success("已從黑名單移除");
    },
    onError: (error) => {
      toast.error("移除失敗：" + error.message);
    },
  });

  const handleAdd = () => {
    if (!phoneNumber.trim()) {
      toast.error("請輸入電話號碼");
      return;
    }
    addMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      reason: reason.trim() || undefined,
    });
  };

  const handleRemove = (phoneNumber: string) => {
    if (confirm(`確定要將 ${phoneNumber} 從黑名單移除嗎？`)) {
      removeMutation.mutate({ phoneNumber });
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">黑名單管理</h1>
            <p className="text-slate-600 mt-2">管理不希望看到報價的電話號碼</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加黑名單
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加到黑名單</DialogTitle>
                <DialogDescription>
                  添加後，該號碼的所有報價將不會在搜索結果中顯示
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">電話號碼 *</Label>
                  <Input
                    id="phone"
                    placeholder="例如：+852 1234 5678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">原因（可選）</Label>
                  <Input
                    id="reason"
                    placeholder="例如：價格過高、不可靠"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleAdd} disabled={addMutation.isPending}>
                  {addMutation.isPending ? "添加中..." : "確認添加"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">載入中...</p>
          </div>
        )}

        {!isLoading && blacklist && blacklist.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Ban className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-700">黑名單為空</p>
              <p className="text-sm text-slate-500 mt-2">點擊右上角的「添加黑名單」按鈕開始</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && blacklist && blacklist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>已屏蔽號碼（{blacklist.length}）</CardTitle>
              <CardDescription>這些號碼的報價不會在搜索結果中顯示</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {blacklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.phoneNumber}</p>
                      {item.reason && (
                        <p className="text-sm text-slate-600 mt-1">原因：{item.reason}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        添加時間：{formatDate(item.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.phoneNumber)}
                      disabled={removeMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
