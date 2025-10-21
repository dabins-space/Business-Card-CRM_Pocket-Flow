"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { LoadingState } from "../components/LoadingState";
import { EmptyState } from "../components/EmptyState";
import {
  Sparkles,
  Building2,
  Search,
  Calendar,
  Clock,
  Eye,
  ArrowLeft,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface AIHistoryPageProps {
  onNavigate?: (page: string) => void;
}

interface AIAnalysisHistoryItem {
  id: string;
  company_name: string;
  analysis_data: any;
  created_at: string;
  updated_at: string;
}

export default function AIHistory({ onNavigate }: AIHistoryPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [history, setHistory] = useState<AIAnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAIHistory();
  }, []);

  const loadAIHistory = async () => {
    try {
      setLoading(true);
      console.log('Loading AI analysis history...');
      
      const response = await fetch('/api/ai-analysis/history');
      const result = await response.json();
      
      console.log('AI History API response:', result);
      
      if (result.ok && result.history) {
        setHistory(result.history);
        console.log('AI history loaded successfully:', result.history.length, 'items');
      } else {
        console.error('Failed to load AI history:', result.error);
        toast.error(result.error || 'AI 분석 히스토리를 불러오는데 실패했습니다');
        setHistory([]);
      }
    } catch (error: any) {
      console.error('Failed to load AI history:', error);
      toast.error('AI 분석 히스토리를 불러오는데 실패했습니다');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAIHistory();
    setRefreshing(false);
    toast.success("히스토리가 새로고침되었습니다");
  };

  const handleViewAnalysis = (item: AIAnalysisHistoryItem) => {
    // AI 인사이트 페이지로 이동하여 해당 회사 분석 결과 표시
    if (onNavigate) {
      // 분석 데이터를 JSON으로 인코딩하여 전달
      const analysisData = encodeURIComponent(JSON.stringify(item.analysis_data));
      onNavigate(`/ai-insights?company=${encodeURIComponent(item.company_name)}&analysisData=${analysisData}&fromHistory=true`);
    }
  };

  const handleViewCustomer = (companyName: string) => {
    // 고객 목록으로 이동
    if (onNavigate) {
      onNavigate("/customers");
    }
  };

  // 필터링된 히스토리
  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.company_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesDate = (() => {
      if (dateFilter === "all") return true;
      
      const itemDate = new Date(item.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case "today":
          return itemDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return itemDate >= monthAgo;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesDate;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ko-KR'),
      time: date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const getAnalysisSummary = (analysisData: any) => {
    if (!analysisData) return "분석 데이터 없음";
    
    if (analysisData.overview) {
      return analysisData.overview.length > 100 
        ? analysisData.overview.substring(0, 100) + "..."
        : analysisData.overview;
    }
    
    return "분석 요약 정보 없음";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate && onNavigate("/ai-insights")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            AI 인사이트
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI 분석 히스토리</h1>
            <p className="text-muted-foreground">
              저장된 AI 분석 결과를 확인하고 관리하세요
            </p>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="회사명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="기간 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 기간</SelectItem>
                <SelectItem value="today">오늘</SelectItem>
                <SelectItem value="week">최근 1주일</SelectItem>
                <SelectItem value="month">최근 1개월</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{history.length}</p>
                <p className="text-sm text-muted-foreground">총 분석 건수</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {history.filter(item => {
                    const itemDate = new Date(item.created_at);
                    const today = new Date();
                    return itemDate.toDateString() === today.toDateString();
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">오늘 분석</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(history.map(item => item.company_name)).size}
                </p>
                <p className="text-sm text-muted-foreground">분석된 회사</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History List */}
      {loading ? (
        <LoadingState message="AI 분석 히스토리를 불러오는 중..." />
      ) : filteredHistory.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="AI 분석 히스토리가 없습니다"
          description={searchQuery || dateFilter !== "all" 
            ? "검색 조건을 변경해보세요" 
            : "AI 인사이트 페이지에서 회사 분석을 시작해보세요"
          }
          actionLabel="AI 인사이트로 이동"
          onAction={() => onNavigate && onNavigate("/ai-insights")}
        />
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => {
            const { date, time } = formatDate(item.created_at);
            
            return (
              <Card key={item.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {item.company_name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {time}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pl-13">
                        <p className="text-muted-foreground leading-relaxed mb-4">
                          {getAnalysisSummary(item.analysis_data)}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            AI 분석
                          </Badge>
                          {item.analysis_data?.industry && (
                            <Badge variant="outline" className="text-xs">
                              {item.analysis_data.industry}
                            </Badge>
                          )}
                          {item.analysis_data?.employees && (
                            <Badge variant="outline" className="text-xs">
                              {item.analysis_data.employees}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleViewAnalysis(item)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        분석 보기
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCustomer(item.company_name)}
                        className="gap-2"
                      >
                        <Building2 className="w-4 h-4" />
                        고객 보기
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
