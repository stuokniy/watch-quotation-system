import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { MessageCircle, Search as SearchIcon, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'date_desc'>('date_desc');

  const { data: quotations, isLoading } = trpc.quotations.search.useQuery({
    searchTerm: searchTerm || undefined,
    sortBy,
  });

  const formatPrice = (price: number, currency: string) => {
    const amount = price / 100;
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getWhatsAppLink = (phone: string, watchModel: string) => {
    const message = encodeURIComponent(`你好，我想詢問關於 ${watchModel} 的報價`);
    // Remove + from phone number for WhatsApp link
    const cleanPhone = phone.replace(/\+/g, '');
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">搜索報價</h1>
          <p className="text-slate-600 mt-2">輸入手錶型號搜索所有報價，點擊 WhatsApp 按鈕直接聯繫報價人</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="輸入手錶型號搜索（例如：116500LN, 5711/1A）"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">最新報價</SelectItem>
                  <SelectItem value="price_asc">價格從低到高</SelectItem>
                  <SelectItem value="price_desc">價格從高到低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">載入中...</p>
          </div>
        )}

        {!isLoading && quotations && quotations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <SearchIcon className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-700">沒有找到報價</p>
              <p className="text-sm text-slate-500 mt-2">
                {searchTerm ? "請嘗試其他搜索關鍵詞" : "請先上傳 WhatsApp 聊天記錄"}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && quotations && quotations.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">找到 {quotations.length} 條報價</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quotations.map((quote) => (
                <Card key={quote.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{quote.watchModel}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-green-600">
                            {formatPrice(quote.price, quote.currency)}
                          </span>
                          {sortBy === 'price_asc' && <TrendingDown className="h-5 w-5 text-green-600" />}
                          {sortBy === 'price_desc' && <TrendingUp className="h-5 w-5 text-red-600" />}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        {quote.warrantyDate && (
                          <div>
                            <span className="font-medium">保卡日期：</span>
                            <span>{quote.warrantyDate}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">報價時間：</span>
                          <span>{formatDate(quote.quoteDate)}</span>
                        </div>
                        <div>
                          <span className="font-medium">報價人：</span>
                          <span>{quote.sellerName || quote.sellerPhone}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => window.open(getWhatsAppLink(quote.sellerPhone, quote.watchModel), '_blank')}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp 聯繫
                      </Button>

                      {quote.messageText && (
                        <details className="text-xs text-slate-500">
                          <summary className="cursor-pointer hover:text-slate-700">查看原始消息</summary>
                          <p className="mt-2 p-2 bg-slate-50 rounded whitespace-pre-wrap">{quote.messageText}</p>
                        </details>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
