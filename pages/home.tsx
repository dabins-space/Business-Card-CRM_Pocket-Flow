"use client";

import React, { useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ImportancePicker } from "../components/ImportancePicker";
import { MultiSelect } from "../components/MultiSelect";
import { INQUIRY_TYPE_OPTIONS } from "../constants/data";
import { Camera, Loader2, Sparkles, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cardsApi } from "../utils/api";
import { uploadCardImage } from "../lib/upload-card-image";
import { useAuth } from "../contexts/AuthContext";

interface HomePageProps {
  onNavigate?: (page: string) => void;
}

export default function Home({ onNavigate }: HomePageProps) {
  const { accessToken } = useAuth();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrComplete, setOcrComplete] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    vertical: "",
  });

  const handleCameraClick = () => {
    // 태블릿/모바일에서는 실제 카메라 촬영을 위해 capture 속성 사용
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedFile(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageDataUrl = reader.result as string;
        setCapturedImage(imageDataUrl);
        
        // Upload image to Supabase Storage
        try {
          console.log('Uploading image to Supabase Storage...');
          const userId = 'current-user'; // TODO: Get actual user ID from auth context
          const uploadResult = await uploadCardImage(file, userId);
          console.log('Upload result:', uploadResult);
          setImageUrl(uploadResult.publicUrl);
        } catch (error) {
          console.error('Upload error:', error);
          toast.error("이미지 업로드 중 오류가 발생했습니다");
        }
        
        startOCR();
      };
      reader.readAsDataURL(file);
    }
  };

  const startOCR = async () => {
    if (!capturedImage) {
      toast.error("이미지를 먼저 촬영해주세요");
      return;
    }

    setOcrLoading(true);
    setOcrComplete(false);
    setSaved(false);

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64: capturedImage }),
      });

      const result = await response.json();

      if (result.ok && result.fields) {
        setFormData(prev => ({
          ...prev,
          name: result.fields.name || "",
          position: result.fields.title || "",
          department: result.fields.department || "",
          company: result.fields.company || "",
          email: result.fields.email || "",
          phone: result.fields.phone || "",
        }));
        setOcrLoading(false);
        setOcrComplete(true);
        toast.success("OCR 분석이 완료되었습니다");
      } else {
        setOcrLoading(false);
        toast.error(result.error || "OCR 분석에 실패했습니다");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      setOcrLoading(false);
      toast.error("OCR 분석 중 오류가 발생했습니다");
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setImageUrl(null);
    setOcrLoading(false);
    setOcrComplete(false);
    setSaved(false);
    setFormData({
      name: "",
      position: "",
      department: "",
      company: "",
      email: "",
      phone: "",
      importance: "3",
      inquiryTypes: [],
      memo: "",
      vertical: "",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!capturedImage || !imageUrl) {
      toast.error("이미지를 먼저 촬영해주세요");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/save-contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { "Authorization": `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          imageUrl,
          name: formData.name,
          title: formData.position,
          department: formData.department,
          company: formData.company,
          email: formData.email,
          phone: formData.phone,
          importance: parseInt(formData.importance),
          inquiryTypes: formData.inquiryTypes,
          memo: formData.memo,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        toast.success("명함이 저장되었습니다");
        setSaved(true);
        
        // Navigate to customers list after 1.5 seconds
        setTimeout(() => {
          onNavigate && onNavigate("/customers");
        }, 1500);
      } else {
        toast.error(result.error || "명함 저장에 실패했습니다");
      }
    } catch (error: any) {
      console.error('Failed to save card:', error);
      toast.error("명함 저장 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  // Initial state: Camera button
  if (!capturedImage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-primary">Pocket Flow</h1>
            <p className="text-foreground">
              명함을 촬영하면 고객 정보가 자동으로 정리됩니다.
            </p>
          </div>

          {/* Camera Area */}
          <div className="bg-card border border-border rounded-lg p-8 md:p-12">
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Camera Icon */}
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                <Camera className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
                aria-label="카메라로 명함 촬영"
              />

              {/* Camera Button */}
              <Button 
                onClick={handleCameraClick}
                className="w-full max-w-xs gap-2"
              >
                <Camera className="w-4 h-4" />
                카메라로 촬영
              </Button>
            </div>
          </div>

          {/* Helper Text */}
          <div className="text-center space-y-1">
            <p className="text-muted-foreground">
              버튼을 누르면 카메라가 열립니다.
            </p>
            <p className="text-muted-foreground">
              명함을 촬영하면 자동으로 정보를 추출합니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // After capture: Show image and OCR results
  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-6">
      {/* Header with status */}
      <div className="text-center space-y-2">
        <h1 className="text-foreground">명함 분석</h1>
        {ocrLoading && (
          <div className="flex items-center justify-center gap-2 text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>AI가 명함을 분석하고 있습니다...</span>
          </div>
        )}
        {ocrComplete && !saved && (
          <div className="flex items-center justify-center gap-2 text-accent">
            <CheckCircle2 className="w-5 h-5" />
            <span>분석 완료! 정보를 확인하고 저장하세요</span>
          </div>
        )}
        {saved && (
          <div className="flex items-center justify-center gap-2 text-accent">
            <CheckCircle2 className="w-5 h-5" />
            <span>저장 완료</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Captured Image */}
          <Card>
            <CardHeader>
              <CardTitle>촬영한 명함</CardTitle>
              <CardDescription>명함 이미지를 확인하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[16/10] rounded-lg overflow-hidden border border-border bg-muted">
                <img
                  src={capturedImage}
                  alt="촬영한 명함"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={startOCR}
                  disabled={ocrLoading}
                  className="flex-1 gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  재분석
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleRetake}
                  className="flex-1 gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  다시 촬영
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right: OCR Results */}
          <Card>
            <CardHeader>
              <CardTitle>추출된 정보</CardTitle>
              <CardDescription>
                {ocrLoading ? "분석 중..." : "정보를 확인하고 수정하세요"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름 *</Label>
                  <Input
                    id="name"
                    required
                    disabled={ocrLoading}
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
                    disabled={ocrLoading}
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
                    disabled={ocrLoading}
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
                    disabled={ocrLoading}
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
                  disabled={ocrLoading}
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
                  disabled={ocrLoading}
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
              {!saved ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRetake}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={ocrLoading}
                  >
                    저장하기
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={() => onNavigate && onNavigate("/ai-insights")}
                    className="flex-1 gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI 인사이트 보기
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onNavigate && onNavigate("/customers")}
                    className="flex-1"
                  >
                    고객 목록 보기
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
