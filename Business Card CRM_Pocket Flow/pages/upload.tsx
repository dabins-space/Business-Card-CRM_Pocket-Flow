"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Uploader } from "../components/Uploader";
import { ImportancePicker } from "../components/ImportancePicker";
import { MultiSelect } from "../components/MultiSelect";
import { INQUIRY_TYPE_OPTIONS } from "../constants/data";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface UploadPageProps {
  onNavigate?: (page: string) => void;
}

export default function CardsUpload({ onNavigate }: UploadPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    department: "",
    company: "",
    email: "",
    phone: "",
    importance: "3",
    inquiryTypes: [] as string[],
    memo: "",
  });

  const handleUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    // Mock OCR processing
    setOcrLoading(true);
    setTimeout(() => {
      setFormData({
        ...formData,
        name: "김철수",
        position: "팀장",
        department: "개발팀",
        company: "테크코퍼레이션",
        email: "kim@techcorp.com",
        phone: "010-1234-5678",
      });
      setOcrLoading(false);
      toast.success("OCR 분석이 완료되었습니다");
    }, 2000);
  };

  const handleOcrRetry = () => {
    setOcrLoading(true);
    setTimeout(() => {
      setOcrLoading(false);
      toast.success("OCR 재분석이 완료되었습니다");
    }, 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("명함이 저장되었습니다");
    if (onNavigate) {
      onNavigate("/customers");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-foreground mb-2">명함 업로드</h1>
        <p className="text-muted-foreground">
          명함을 업로드하면 자동으로 정보를 추출합니다
        </p>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Uploader */}
          <Card>
            <CardHeader>
              <CardTitle>명함 이미지</CardTitle>
              <CardDescription>
                명함을 업로드하거나 카메라로 촬영하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Uploader onUpload={handleUpload} allowCamera />
              {ocrLoading && (
                <div className="flex items-center gap-2 text-primary mt-4 p-3 rounded-lg bg-primary/10">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>OCR 분석 중...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: OCR Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>추출된 정보</CardTitle>
                  <CardDescription>OCR 결과를 확인하고 수정하세요</CardDescription>
                </div>
                {file && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleOcrRetry}
                    disabled={ocrLoading}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    재분석
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">직책</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">부서</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">회사</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>추가 정보</CardTitle>
            <CardDescription>중요도와 문의 유형을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImportancePicker
              value={formData.importance}
              onChange={(value) => setFormData({ ...formData, importance: value })}
            />

            <MultiSelect
              label="문의 유형"
              options={INQUIRY_TYPE_OPTIONS}
              value={formData.inquiryTypes}
              onChange={(value) =>
                setFormData({ ...formData, inquiryTypes: value })
              }
              placeholder="문의 유형을 선택하세요"
            />

            <div className="space-y-2">
              <Label htmlFor="memo">메모 (대화 내용)</Label>
              <Textarea
                id="memo"
                rows={4}
                placeholder="명함 교환 시 나눈 대화 내용이나 특이사항을 기록하세요"
                value={formData.memo}
                onChange={(e) =>
                  setFormData({ ...formData, memo: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                저장하기
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate && onNavigate("/customers")}
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
