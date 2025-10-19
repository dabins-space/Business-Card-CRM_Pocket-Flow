"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Info } from "lucide-react";
import { toast } from "sonner";

interface OnboardingPageProps {
  onNavigate?: (page: string) => void;
}

export default function Onboarding({ onNavigate }: OnboardingPageProps) {
  const [formData, setFormData] = useState({
    email: "",
    company: "",
    phone: "",
    department: "",
    position: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("정보가 저장되었습니다");
    if (onNavigate) {
      onNavigate("/");
    }
  };

  const handleSkip = () => {
    if (onNavigate) {
      onNavigate("/");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-foreground mb-2">환영합니다!</h1>
        <p className="text-muted-foreground">
          더 나은 서비스 제공을 위해 추가 정보를 입력해주세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>사용자 정보</CardTitle>
              <CardDescription>
                입력하신 정보는 서비스 이용 시 자동으로 입력됩니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    이메일 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">회사명</Label>
                    <Input
                      id="company"
                      placeholder="회사명을 입력하세요"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">전화번호</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="010-0000-0000"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">부서</Label>
                    <Input
                      id="department"
                      placeholder="영업부"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">직책</Label>
                    <Input
                      id="position"
                      placeholder="팀장"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    저장하기
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkip}
                    className="flex-1"
                  >
                    나중에 하기
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Notice */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>개인정보 수집 안내</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  입력하신 정보는 서비스 이용 목적으로만 사용되며, 안전하게 보호됩니다.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-muted-foreground">
                <p>• 수집 항목: 이메일, 회사명, 전화번호, 부서/직책</p>
                <p>• 수집 목적: 서비스 제공 및 업무 효율화</p>
                <p>• 보유 기간: 회원 탈퇴 시까지</p>
              </div>

              <p className="text-muted-foreground">
                개인정보 수집 및 이용에 동의하시면 저장하기 버튼을 클릭해주세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
