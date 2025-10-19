"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Sparkles,
  Calendar,
  Target,
  Activity,
} from "lucide-react";
import { Badge } from "../components/ui/badge";

interface ReportsPageProps {
  onNavigate?: (page: string) => void;
}

export default function Reports({ onNavigate }: ReportsPageProps) {
  const [period, setPeriod] = useState("month");

  // Mock 통계 데이터
  const kpiData = {
    totalCards: 48,
    thisMonth: 12,
    totalCompanies: 32,
    aiInsights: 24,
    avgImportance: 3.8,
    trend: "+15%",
  };

  const industryData = [
    { name: "소프트웨어 개발", count: 15, percentage: 31 },
    { name: "제조업", count: 10, percentage: 21 },
    { name: "금융", count: 8, percentage: 17 },
    { name: "유통/물류", count: 7, percentage: 15 },
    { name: "기타", count: 8, percentage: 16 },
  ];

  const topCompanies = [
    { name: "테크코퍼레이션", contacts: 5, importance: 5, lastContact: "2025-10-17" },
    { name: "디자인스튜디오", contacts: 4, importance: 4, lastContact: "2025-10-16" },
    { name: "솔루션즈", contacts: 3, importance: 4, lastContact: "2025-10-15" },
    { name: "이노베이션랩", contacts: 3, importance: 3, lastContact: "2025-10-12" },
    { name: "글로벌파트너스", contacts: 2, importance: 5, lastContact: "2025-10-10" },
  ];

  const activityData = [
    { week: "1주차", cards: 8, insights: 5 },
    { week: "2주차", cards: 12, insights: 7 },
    { week: "3주차", cards: 10, insights: 6 },
    { week: "4주차", cards: 15, insights: 9 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-foreground">리포트</h1>
            <p className="text-muted-foreground">활동 통계 및 분석</p>
          </div>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">최근 1주</SelectItem>
            <SelectItem value="month">최근 1개월</SelectItem>
            <SelectItem value="quarter">최근 3개월</SelectItem>
            <SelectItem value="year">최근 1년</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">총 명함 수</p>
                <h3 className="text-foreground mt-1">{kpiData.totalCards}</h3>
                <div className="flex items-center gap-1 text-accent mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-sm">{kpiData.trend}</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">이번 달</p>
                <h3 className="text-foreground mt-1">{kpiData.thisMonth}</h3>
                <p className="text-muted-foreground mt-1">새 명함</p>
              </div>
              <Calendar className="w-8 h-8 text-accent opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">총 회사 수</p>
                <h3 className="text-foreground mt-1">{kpiData.totalCompanies}</h3>
                <p className="text-muted-foreground mt-1">협력사</p>
              </div>
              <Building2 className="w-8 h-8 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">AI 분석</p>
                <h3 className="text-foreground mt-1">{kpiData.aiInsights}</h3>
                <p className="text-muted-foreground mt-1">인사이트</p>
              </div>
              <Sparkles className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            주간 활동량
          </CardTitle>
          <CardDescription>명함 등록 및 AI 인사이트 생성 추이</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityData.map((week) => (
              <div key={week.week}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground">{week.week}</span>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>명함: {week.cards}</span>
                    <span>인사이트: {week.insights}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(week.cards / 15) * 100}%` }}
                    />
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(week.insights / 15) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">명함 등록</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-muted-foreground">AI 인사이트</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              산업군 분포
            </CardTitle>
            <CardDescription>등록된 명함의 산업별 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {industryData.map((industry) => (
                <div key={industry.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-foreground">{industry.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{industry.count}개</span>
                      <Badge variant="secondary">{industry.percentage}%</Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${industry.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              주요 고객사
            </CardTitle>
            <CardDescription>명함 수 기준 상위 고객사</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCompanies.map((company, index) => (
                <div
                  key={company.name}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => onNavigate && onNavigate("/customers")}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-foreground">{company.name}</p>
                        <p className="text-muted-foreground">
                          {company.contacts}명 · 중요도 {company.importance}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-muted-foreground pl-11">
                    최근 접촉: {company.lastContact}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>기간 요약</CardTitle>
          <CardDescription>선택한 기간의 주요 활동 요약</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-muted-foreground mb-2">평균 중요도</p>
              <h3 className="text-foreground">{kpiData.avgImportance}</h3>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-muted-foreground mb-2">가장 활발한 산업</p>
              <h4 className="text-foreground">소프트웨어</h4>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-muted-foreground mb-2">성장률</p>
              <h3 className="text-accent">{kpiData.trend}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
