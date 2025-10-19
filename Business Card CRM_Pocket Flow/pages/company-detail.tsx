"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { LoadingState } from "../components/LoadingState";
import {
  Building2,
  Sparkles,
  Calendar,
  Users,
  Globe,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { toast } from "sonner";
import { getPriorityColor } from "../utils/helpers";

interface CompanyDetailPageProps {
  onNavigate?: (page: string) => void;
}

export default function CompaniesDetail({ onNavigate }: CompanyDetailPageProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const companyData = {
    name: "테크코퍼레이션",
    industry: "소프트웨어 개발",
    employees: "50-100명",
    founded: "2015년",
    website: "www.techcorp.com",
    location: "서울특별시 강남구",
  };

  const aiSummary = {
    overview:
      "테크코퍼레이션은 엔터프라이즈급 B2B SaaS 솔루션을 전문으로 하는 중견 소프트웨어 개발 회사입니다. 특히 클라우드 기반 협업 도구와 데이터 분석 플랫폼 개발에 강점을 보이고 있으며, 최근 3년간 연평균 40% 이상의 성장률을 기록하고 있습니다.",
    lastUpdated: "2025-10-17",
  };

  const opportunities = [
    {
      id: 1,
      title: "API 통합 파트너십",
      description: "당사의 결제 솔루션과 테크코퍼레이션의 협업 플랫폼 통합 가능성",
      priority: "high",
      impact: "높음",
    },
    {
      id: 2,
      title: "공동 마케팅 캠페인",
      description: "B2B 시장 타겟 공동 마케팅을 통한 시장 점유율 확대",
      priority: "medium",
      impact: "중간",
    },
    {
      id: 3,
      title: "기술 자문 및 컨설팅",
      description: "클라우드 인프라 최적화 컨설팅 서비스 제공 기회",
      priority: "medium",
      impact: "중간",
    },
  ];

  const relatedCards = [
    { id: 1, name: "김철수", position: "개발팀장", importance: 5 },
    { id: 2, name: "이영희", position: "CTO", importance: 4 },
  ];

  const handleGenerateSummary = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("AI 요약이 생성되었습니다");
    }, 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-foreground mb-2">{companyData.name}</h1>
            <p className="text-muted-foreground">{companyData.industry}</p>
          </div>
        </div>

        <Button
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          AI 요약 생성
        </Button>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">직원 수</p>
                <p className="text-foreground">{companyData.employees}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">설립연도</p>
                <p className="text-foreground">{companyData.founded}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">웹사이트</p>
                <a
                  href={`https://${companyData.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {companyData.website}
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI 요약
              </CardTitle>
              <CardDescription>
                OpenAI 기반 회사 분석 및 비즈니스 기회 탐색
              </CardDescription>
            </div>
            {aiSummary.lastUpdated && (
              <span className="text-muted-foreground">
                {aiSummary.lastUpdated} 업데이트
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <LoadingState message="AI가 회사 정보를 분석하고 있습니다..." />
          ) : (
            <>
              <Alert className="mb-4">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  아래 요약은 AI가 생성한 내용으로, 실제와 다를 수 있습니다.
                </AlertDescription>
              </Alert>
              <p className="text-foreground leading-relaxed">{aiSummary.overview}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Business Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent" />
            비즈니스 기회
          </CardTitle>
          <CardDescription>AI가 분석한 협업 가능성 및 제안 사항</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {opportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-foreground">{opportunity.title}</h3>
                  <Badge className={getPriorityColor(opportunity.priority)}>
                    {opportunity.impact}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{opportunity.description}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline">
                    캘린더에 추가
                  </Button>
                  <Button size="sm" variant="ghost">
                    자세히 보기
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Related Cards */}
      <Card>
        <CardHeader>
          <CardTitle>관련 명함</CardTitle>
          <CardDescription>이 회사의 등록된 명함</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {relatedCards.map((card) => (
              <div
                key={card.id}
                onClick={() => onNavigate && onNavigate("/card-detail")}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-foreground">{card.name}</p>
                  <p className="text-muted-foreground">{card.position}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded ${
                    card.importance >= 4
                      ? "bg-destructive/20 text-destructive"
                      : "bg-warning/20 text-warning"
                  }`}
                >
                  {card.importance}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
