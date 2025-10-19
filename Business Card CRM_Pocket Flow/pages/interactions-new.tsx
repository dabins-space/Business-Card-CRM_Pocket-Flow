"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ImportancePicker } from "../components/ImportancePicker";
import { MultiSelect } from "../components/MultiSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { CreditCard, Building2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { INQUIRY_TYPE_OPTIONS, MOCK_CARDS_SIMPLE } from "../constants/data";

interface InteractionsNewPageProps {
  onNavigate?: (page: string) => void;
}

export default function InteractionsNew({ onNavigate }: InteractionsNewPageProps) {
  const [formData, setFormData] = useState({
    cardId: "",
    importance: "3",
    inquiryTypes: [] as string[],
    memo: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cardId) {
      toast.error("명함을 선택해주세요");
      return;
    }
    if (!formData.memo.trim()) {
      toast.error("대화 내용을 입력해주세요");
      return;
    }
    toast.success("대화 기록이 저장되었습니다");
    if (onNavigate) {
      onNavigate("/cards");
    }
  };

  const selectedCard = MOCK_CARDS_SIMPLE.find((c) => c.value === formData.cardId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-foreground mb-2">새 대화 기록</h1>
        <p className="text-muted-foreground">
          명함과 관련된 대화 내용을 기록하세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Related Card */}
        <Card>
          <CardHeader>
            <CardTitle>관련 명함</CardTitle>
            <CardDescription>대화한 명함을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card">명함 선택 *</Label>
              <Select value={formData.cardId} onValueChange={(value) => setFormData({ ...formData, cardId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="명함을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_CARDS_SIMPLE.map((card) => (
                    <SelectItem key={card.value} value={card.value}>
                      {card.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCard && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground">{selectedCard.label.split(" - ")[0]}</p>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Building2 className="w-4 h-4" />
                      <span>{selectedCard.company}</span>
                    </div>
                    <p className="text-muted-foreground mt-1">{selectedCard.position}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interaction Details */}
        <Card>
          <CardHeader>
            <CardTitle>대화 상세</CardTitle>
            <CardDescription>대화 내용과 중요도를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">날짜</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 bg-input-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <ImportancePicker
              value={formData.importance}
              onChange={(value) => setFormData({ ...formData, importance: value })}
            />

            <MultiSelect
              label="문의 유형"
              options={INQUIRY_TYPE_OPTIONS}
              value={formData.inquiryTypes}
              onChange={(value) => setFormData({ ...formData, inquiryTypes: value })}
              placeholder="문의 유형을 선택하세요"
            />

            <div className="space-y-2">
              <Label htmlFor="memo">
                대화 내용 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="memo"
                rows={8}
                required
                placeholder="대화 내용, 논의된 주제, 후속 조치 등을 자세히 기록하세요..."
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              />
              <p className="text-muted-foreground">
                상세한 기록이 추후 비즈니스 기회 발굴에 도움이 됩니다
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" className="flex-1">
                저장하기
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate && onNavigate("/cards")}
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
