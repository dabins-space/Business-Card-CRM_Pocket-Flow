"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { Search, Filter, Camera, CreditCard, Building2, Mail, Phone, Users } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { getVerticalLabel, VERTICAL_OPTIONS } from "../constants/data";
import { getImportanceColor } from "../utils/helpers";
import { cardsApi } from "../utils/api";
import { toast } from "sonner";

interface CustomersPageProps {
  onNavigate?: (page: string) => void;
}

export default function Customers({ onNavigate }: CustomersPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [importanceFilter, setImportanceFilter] = useState("all");
  const [verticalFilter, setVerticalFilter] = useState("all");
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      // Mock data - in a real app with auth, this would call: await cardsApi.list(accessToken);
      const mockCards = [
        {
          id: '1',
          name: '홍길동',
          title: '대표이사',
          company: '테크놀로지',
          vertical: 'IT',
          importance: 5,
          phone: '010-1234-5678',
          email: 'hong@tech.com',
          inquiryTypes: ['신규 프로젝트', '기술 협력'],
          date: '2024.03.15'
        },
        {
          id: '2', 
          name: '김철수',
          title: '부장',
          company: '바이오메드',
          vertical: 'bio',
          importance: 3,
          phone: '010-9876-5432',
          email: 'kim@biomed.com',
          inquiryTypes: ['파트너십'],
          date: '2024.03.10'
        }
      ];
      setCards(mockCards);
    } catch (error: any) {
      console.error('Failed to load cards:', error);
      toast.error('명함 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesImportance =
      importanceFilter === "all" || card.importance?.toString() === importanceFilter;
    const matchesVertical =
      verticalFilter === "all" || card.vertical === verticalFilter;
    return matchesSearch && matchesImportance && matchesVertical;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-foreground">고객 목록</h1>
            <p className="text-muted-foreground">
              총 {filteredCards.length}개의 명함
            </p>
          </div>
        </div>
        <Button onClick={() => onNavigate && onNavigate("/upload")}>
          <Camera className="w-4 h-4" />
          명함 등록
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="이름 또는 회사명 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={verticalFilter} onValueChange={setVerticalFilter}>
              <SelectTrigger>
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="버티컬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 산업</SelectItem>
                {VERTICAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={importanceFilter} onValueChange={setImportanceFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="중요도" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 중요도</SelectItem>
                <SelectItem value="5">중요도 5</SelectItem>
                <SelectItem value="4">중요도 4</SelectItem>
                <SelectItem value="3">중요도 3</SelectItem>
                <SelectItem value="2">중요도 2</SelectItem>
                <SelectItem value="1">중요도 1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards Grid */}
      {loading ? (
        <LoadingState message="명함 목록을 불러오는 중..." />
      ) : filteredCards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="명함이 없습니다"
          description="검색 조건을 변경하거나 새로운 명함을 등록하세요"
          actionLabel="명함 등록"
          onAction={() => onNavigate && onNavigate("/upload")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <Card
              key={card.id}
              className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => onNavigate && onNavigate("/customer-detail")}
            >
              <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded ${getImportanceColor(
                      card.importance
                    )}`}
                  >
                    {card.importance}
                  </span>
                </div>
              </div>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <h3 className="text-foreground">{card.name}</h3>
                  <p className="text-muted-foreground">
                    {card.position}
                    {card.department && ` · ${card.department}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground flex-1 min-w-0">
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{card.company}</span>
                  </div>
                  {card.vertical && (
                    <Badge variant="outline" className="border-primary/30 text-primary flex-shrink-0">
                      {getVerticalLabel(card.vertical)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{card.email}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{card.phone}</span>
                </div>

                <div className="flex flex-wrap gap-1 pt-2">
                  {card.inquiryTypes.map((type: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {type}
                    </Badge>
                  ))}
                </div>

                <div className="text-muted-foreground pt-2 border-t border-border">
                  {card.date}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
