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
import { uploadCardImage } from "../lib/upload-card-image";
import { useAuth } from "../contexts/AuthContext";

interface UploadPageProps {
  onNavigate?: (page: string) => void;
}

export default function CardsUpload({ onNavigate }: UploadPageProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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

  const handleUpload = async (uploadedFile: File) => {
    console.log('=== handleUpload called ===');
    console.log('File:', uploadedFile.name, uploadedFile.size, uploadedFile.type);
    
    setFile(uploadedFile);
    setOcrLoading(true);
    
    try {
      // Upload image to Supabase Storage first
      console.log('Uploading image to Supabase Storage...');
      const userId = user?.id || 'current-user';
      const uploadResult = await uploadCardImage(uploadedFile, userId);
      console.log('Upload result:', uploadResult);
      setImageUrl(uploadResult.publicUrl);
      
      // Convert file to base64 for OCR
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        console.log('Base64 string length:', base64String.length);
        
        try {
          console.log('Calling OCR API...');
          const response = await fetch('/api/ocr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageBase64: base64String }),
          });
          
          console.log('OCR Response status:', response.status);
          const result = await response.json();
          console.log('OCR Response:', result);
          
          if (result.ok && result.fields) {
            console.log('OCR successful, updating form data');
            setFormData({
              ...formData,
              name: result.fields.name || "",
              position: result.fields.title || "",
              department: result.fields.department || "",
              company: result.fields.company || "",
              email: result.fields.email || "",
              phone: result.fields.phone || "",
            });
            toast.success("OCR 분석이 완료되었습니다");
          } else {
            console.error('OCR Error:', result);
            toast.error(result.error || "OCR 분석에 실패했습니다");
          }
        } catch (error) {
          console.error('OCR API Error:', error);
          toast.error(`OCR 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setOcrLoading(false);
        }
      };
      
      reader.onerror = () => {
        console.error('FileReader error');
        toast.error("파일 읽기 중 오류가 발생했습니다");
        setOcrLoading(false);
      };
      
      console.log('Reading file as data URL...');
      reader.readAsDataURL(uploadedFile);
    } catch (error) {
      console.error('File processing error:', error);
      toast.error("파일 처리 중 오류가 발생했습니다");
      setOcrLoading(false);
    }
  };

  const handleOcrRetry = async () => {
    if (!file) return;
    
    console.log('=== handleOcrRetry called ===');
    setOcrLoading(true);
    
    try {
      // Convert file to base64 for OCR
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        console.log('Base64 string length:', base64String.length);
        
        try {
          console.log('Calling OCR API for retry...');
          const response = await fetch('/api/ocr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageBase64: base64String }),
          });
          
          console.log('OCR Retry Response status:', response.status);
          const result = await response.json();
          console.log('OCR Retry Response:', result);
          
          if (result.ok && result.fields) {
            console.log('OCR retry successful, updating form data');
            setFormData({
              ...formData,
              name: result.fields.name || "",
              position: result.fields.title || "",
              department: result.fields.department || "",
              company: result.fields.company || "",
              email: result.fields.email || "",
              phone: result.fields.phone || "",
            });
            toast.success("OCR 재분석이 완료되었습니다");
          } else {
            console.error('OCR Retry Error:', result);
            toast.error(result.error || "OCR 재분석에 실패했습니다");
          }
        } catch (error) {
          console.error('OCR Retry API Error:', error);
          toast.error(`OCR 재분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setOcrLoading(false);
        }
      };
      
      reader.onerror = () => {
        console.error('FileReader error during retry');
        toast.error("파일 읽기 중 오류가 발생했습니다");
        setOcrLoading(false);
      };
      
      console.log('Reading file as data URL for retry...');
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('OCR retry error:', error);
      toast.error("OCR 재분석 중 오류가 발생했습니다");
      setOcrLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !imageUrl) {
      toast.error("명함 이미지를 업로드해주세요");
      return;
    }
    
    try {
      const saveData = {
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
      };
      
      console.log('Saving contact data:', saveData);
      
      const response = await fetch('/api/save-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });
      
      console.log('Save Response status:', response.status);
      const result = await response.json();
      console.log('Save Response:', result);
      
      if (result.ok) {
        toast.success("명함이 저장되었습니다");
        if (onNavigate) {
          onNavigate("/customers");
        }
      } else {
        console.error('Save Error:', result);
        toast.error(result.error || "명함 저장에 실패했습니다");
      }
    } catch (error) {
      console.error('Save contact error:', error);
      toast.error(`명함 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
