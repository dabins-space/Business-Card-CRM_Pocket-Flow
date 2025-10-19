"use client";

import React, { useState } from "react";
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
import { Search, Filter, Upload, CreditCard, Building2, Mail, Phone } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { MOCK_CARDS } from "../constants/data";
import { getImportanceColor } from "../utils/helpers";

interface CardsPageProps {
  onNavigate?: (page: string) => void;
}

export default function CardsList({ onNavigate }: CardsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [importanceFilter, setImportanceFilter] = useState("all");

  const filteredCards = MOCK_CARDS.filter((card) => {
    const matchesSearch =
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesImportance =
      importanceFilter === "all" || card.importance.toString() === importanceFilter;
    return matchesSearch && matchesImportance;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-2">명함 목록</h1>
          <p className="text-muted-foreground">
            총 {filteredCards.length}개의 명함
          </p>
        </div>
        <Button onClick={() => onNavigate && onNavigate("/upload")}>
          <Upload className="w-4 h-4" />
          명함 업로드
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="이름 또는 회사명 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={importanceFilter} onValueChange={setImportanceFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="중요도" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="5">중요도 5</SelectItem>
                <SelectItem value="4">중요도 4</SelectItem>
                <SelectItem value="3">중요도 3</SelectItem>
                <SelectItem value="2">중요도 2</SelectItem>
                <SelectItem value="1">중요도 1</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="recent">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">최신순</SelectItem>
                <SelectItem value="name">이름순</SelectItem>
                <SelectItem value="company">회사명순</SelectItem>
                <SelectItem value="importance">중요도순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="명함이 없습니다"
          description="검색 조건을 변경하거나 새로운 명함을 업로드하세요"
          actionLabel="명함 업로드"
          onAction={() => onNavigate && onNavigate("/upload")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <Card
              key={card.id}
              className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => onNavigate && onNavigate("/card-detail")}
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

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{card.company}</span>
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
                  {card.inquiryTypes.map((type, index) => (
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
