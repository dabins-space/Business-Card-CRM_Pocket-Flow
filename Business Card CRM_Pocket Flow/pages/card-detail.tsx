"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Building2,
  Mail,
  Phone,
  Edit,
  Trash2,
  Sparkles,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { getImportanceColor } from "../utils/helpers";

interface CardDetailPageProps {
  onNavigate?: (page: string) => void;
}

export default function CardsDetail({ onNavigate }: CardDetailPageProps) {
  const [activeTab, setActiveTab] = useState("info");

  const cardData = {
    id: 1,
    name: "김철수",
    position: "팀장",
    department: "개발팀",
    company: "테크코퍼레이션",
    email: "kim@techcorp.com",
    phone: "010-1234-5678",
    importance: 5,
    inquiryTypes: ["제안", "파트너십"],
    memo: "새로운 프로젝트 협업 논의. 내년 1분기 시작 예정.",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=500&fit=crop",
    date: "2025-10-17",
  };

  const companyInfo = {
    name: "테크코퍼레이션",
    industry: "소프트웨어 개발",
    employees: "50-100명",
    founded: "2015년",
    website: "www.techcorp.com",
  };

  const interactions = [
    { id: 1, date: "2025-10-17", type: "제안", importance: 5, memo: "프로젝트 협업 제안" },
    { id: 2, date: "2025-10-10", type: "상담", importance: 4, memo: "기술 스택 논의" },
  ];

  const handleDelete = () => {
    toast.success("명함이 삭제되었습니다");
    if (onNavigate) {
      onNavigate("/cards");
    }
  };

  const handleOcrRetry = () => {
    toast.success("OCR 재분석이 시작되었습니다");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-foreground">{cardData.name}</h1>
            <span
              className={`px-2 py-1 rounded ${getImportanceColor(
                cardData.importance
              )}`}
            >
              {cardData.importance}
            </span>
          </div>
          <p className="text-muted-foreground">
            {cardData.position} · {cardData.department} · {cardData.company}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <Edit className="w-4 h-4" />
            수정
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleOcrRetry}
          >
            <Sparkles className="w-4 h-4" />
            재분석
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>명함을 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 취소할 수 없습니다. 명함과 관련된 모든 정보가 삭제됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Image */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>명함 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-[16/10] rounded-lg overflow-hidden border border-border">
              <img
                src={cardData.image}
                alt={cardData.name}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right: Tabs */}
        <Card className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="info">기본 정보</TabsTrigger>
                <TabsTrigger value="company">회사 정보</TabsTrigger>
                <TabsTrigger value="interactions">대화 기록</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="info" className="space-y-4 mt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">이메일</p>
                      <p className="text-foreground">{cardData.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">전화번호</p>
                      <p className="text-foreground">{cardData.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">등록일</p>
                      <p className="text-foreground">{cardData.date}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-muted-foreground mb-2">문의 유형</p>
                  <div className="flex flex-wrap gap-2">
                    {cardData.inquiryTypes.map((type, index) => (
                      <Badge key={index} variant="secondary">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {cardData.memo && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-muted-foreground mb-2">메모</p>
                    <p className="text-foreground">{cardData.memo}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="company" className="space-y-4 mt-0">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-6 h-6 text-primary" />
                  <h3 className="text-foreground">{companyInfo.name}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground mb-1">산업</p>
                    <p className="text-foreground">{companyInfo.industry}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground mb-1">직원 수</p>
                    <p className="text-foreground">{companyInfo.employees}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground mb-1">설립연도</p>
                    <p className="text-foreground">{companyInfo.founded}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground mb-1">웹사이트</p>
                    <p className="text-foreground">{companyInfo.website}</p>
                  </div>
                </div>

                <Button className="w-full gap-2" onClick={() => onNavigate && onNavigate("/companies")}>
                  <Building2 className="w-4 h-4" />
                  회사 상세 보기
                </Button>
              </TabsContent>

              <TabsContent value="interactions" className="space-y-3 mt-0">
                {interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => onNavigate && onNavigate("/interactions")}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{interaction.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded ${getImportanceColor(
                            interaction.importance
                          )}`}
                        >
                          {interaction.importance}
                        </span>
                        <span className="text-muted-foreground">{interaction.date}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{interaction.memo}</p>
                  </div>
                ))}

                <Button variant="outline" className="w-full gap-2" onClick={() => onNavigate && onNavigate("/interactions")}>
                  <MessageSquare className="w-4 h-4" />
                  새 대화 기록 추가
                </Button>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
