import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Upload as UploadIcon, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<Array<{
    filename: string;
    success: boolean;
    totalMessages?: number;
    parsedQuotations?: number;
    error?: string;
  }>>([]);

  const uploadMutation = trpc.chatFiles.upload.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setUploadResults([]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
      setUploadResults([]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("請選擇至少一個文件");
      return;
    }

    setUploading(true);
    const results: typeof uploadResults = [];

    for (const file of files) {
      try {
        // Read file as text
        const text = await file.text();
        // Convert to base64
        const base64 = btoa(unescape(encodeURIComponent(text)));

        const result = await uploadMutation.mutateAsync({
          filename: file.name,
          content: base64,
        });

        results.push({
          filename: file.name,
          success: true,
          totalMessages: result.totalMessages,
          parsedQuotations: result.parsedQuotations,
        });

        toast.success(`${file.name} 上傳成功！提取了 ${result.parsedQuotations} 條報價`);
      } catch (error) {
        results.push({
          filename: file.name,
          success: false,
          error: error instanceof Error ? error.message : "上傳失敗",
        });
        toast.error(`${file.name} 上傳失敗`);
      }
    }

    setUploadResults(results);
    setUploading(false);
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">上傳 WhatsApp 聊天記錄</h1>
          <p className="text-slate-600 mt-2">上傳 WhatsApp 導出的聊天記錄文件，系統會自動提取手錶報價信息</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>選擇文件</CardTitle>
            <CardDescription>支持 .txt 格式的 WhatsApp 聊天導出文件，可一次上傳多個文件</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-slate-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <UploadIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-lg font-medium text-slate-700 mb-2">
                拖放文件到此處，或點擊選擇文件
              </p>
              <p className="text-sm text-slate-500">支持 .txt 格式</p>
              <input
                id="file-input"
                type="file"
                accept=".txt"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="font-medium text-slate-700">已選擇 {files.length} 個文件：</p>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                      <FileText className="h-4 w-4" />
                      <span>{file.name}</span>
                      <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="flex-1"
              >
                {uploading ? "上傳中..." : "開始上傳"}
              </Button>
              {files.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiles([]);
                    setUploadResults([]);
                  }}
                  disabled={uploading}
                >
                  清除
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {uploadResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>上傳結果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uploadResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{result.filename}</p>
                      {result.success ? (
                        <p className="text-sm text-slate-600 mt-1">
                          成功解析 {result.totalMessages} 條消息，提取 {result.parsedQuotations} 條報價
                        </p>
                      ) : (
                        <p className="text-sm text-red-600 mt-1">{result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">如何導出 WhatsApp 聊天記錄？</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p><strong>iOS / Android:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>打開 WhatsApp，選擇要導出的聊天</li>
              <li>點擊右上角的三點菜單</li>
              <li>選擇「更多」→「導出聊天記錄」</li>
              <li>選擇「不含媒體文件」</li>
              <li>保存為 .txt 文件</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
