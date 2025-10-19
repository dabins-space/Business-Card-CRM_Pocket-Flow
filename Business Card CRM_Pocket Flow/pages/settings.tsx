"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { LoadingState } from "../components/LoadingState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Settings as SettingsIcon,
  Lock,
  Users,
  Tag,
  Plus,
  Edit,
  Trash2,
  Shield,
  BarChart3,
  Sparkles,
  Eye,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { INQUIRY_TYPE_OPTIONS, VERTICAL_OPTIONS } from "../constants/data";
import { Textarea } from "../components/ui/textarea";
import { adminApi, settingsApi } from "../utils/api";

interface WhitelistUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  allowed: boolean;
  createdAt: string;
}

interface SettingsPageProps {
  onNavigate?: (page: string) => void;
}

export default function Settings({ onNavigate }: SettingsPageProps) {
  const isAdmin = true; // Mock admin for demo
  const [activeTab, setActiveTab] = useState(isAdmin ? "users" : "system");
  const [loading, setLoading] = useState(false);

  // User Management (whitelist emails)
  const [whitelist, setWhitelist] = useState<string[]>([]);

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (isAdmin) {
      loadWhitelist();
    }
    loadCompanySettings();
    loadInquiryTypes();
  }, [isAdmin]);

  const loadWhitelist = async () => {
    try {
      // Mock whitelist data - in a real app with auth, this would call: await adminApi.getWhitelist(accessToken);
      const mockWhitelist = ['user@example.com', 'admin@example.com'];
      setWhitelist(mockWhitelist);
    } catch (error: any) {
      console.error('Failed to load whitelist:', error);
    }
  };

  const loadCompanySettings = async () => {
    try {
      // Mock company settings - in a real app with auth, this would call: await settingsApi.getCompanySettings(accessToken);
      // For now, just use localStorage data
      console.log('Loading company settings from localStorage');
    } catch (error: any) {
      console.error('Failed to load company settings:', error);
    }
  };

  const loadInquiryTypes = async () => {
    try {
      // Mock inquiry types - in a real app with auth, this would call: await settingsApi.getInquiryTypes(accessToken);
      // Use the constants from data.ts
      console.log('Using inquiry types from constants');
    } catch (error: any) {
      console.error('Failed to load inquiry types:', error);
    }
  };

  // Inquiry Types
  const [inquiryTypes, setInquiryTypes] = useState(INQUIRY_TYPE_OPTIONS);
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [typeForm, setTypeForm] = useState({ value: "", label: "" });

  // KPI Settings
  const [kpiSettings, setKpiSettings] = useState({
    showTotalCards: true,
    showMonthlyCards: true,
    showAIInsights: true,
    showIndustryDistribution: true,
    showTopCompanies: true,
    targetCardsPerMonth: "10",
    targetAIAnalysis: "5",
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    aiModel: "gpt-4",
    language: "ko",
    autoAnalysis: true,
    emailNotifications: true,
  });

  // Company Info
  const [companyInfo, setCompanyInfo] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('companyInfo');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {
      companyName: "",
      vertical: "",
      productName: "",
      features: "",
      targetIndustries: "",
      proposalPoints: "",
    };
  });

  const handleAddUser = async () => {
    if (!newEmail.trim()) {
      toast.error("이메일을 입력해주세요");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('올바른 이메일 형식을 입력하세요');
      return;
    }

    try {
      // Mock add to whitelist - in a real app with auth, this would call: await adminApi.addToWhitelist(newEmail, accessToken);
      setWhitelist([...whitelist, newEmail]);
      setNewEmail("");
      setIsAddUserOpen(false);
      toast.success("사용자가 추가되었습니다");
    } catch (error: any) {
      console.error('Failed to add to whitelist:', error);
      toast.error(error.message || '사용자 추가에 실패했습니다');
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`${email}을 화이트리스트에서 제거하시겠습니까?`)) {
      return;
    }

    try {
      // Mock remove from whitelist - in a real app with auth, this would call: await adminApi.removeFromWhitelist(email, accessToken);
      setWhitelist(whitelist.filter(e => e !== email));
      toast.success("사용자가 삭제되었습니다");
    } catch (error: any) {
      console.error('Failed to remove from whitelist:', error);
      toast.error(error.message || '사용자 삭제에 실패했습니다');
    }
  };

  const handleAddInquiryType = () => {
    if (!typeForm.value.trim() || !typeForm.label.trim()) {
      toast.error("값과 레이블을 입력해주세요");
      return;
    }
    if (inquiryTypes.some((t) => t.value === typeForm.value)) {
      toast.error("이미 존재하는 값입니다");
      return;
    }

    setInquiryTypes([...inquiryTypes, { value: typeForm.value, label: typeForm.label }]);
    setTypeForm({ value: "", label: "" });
    setIsAddTypeOpen(false);
    toast.success("문의 유형이 추가되었습니다");
  };

  const handleDeleteInquiryType = (value: string) => {
    setInquiryTypes(inquiryTypes.filter((t) => t.value !== value));
    toast.success("문의 유형이 삭제되었습니다");
  };

  const handleSaveCompanyInfo = async () => {
    const accessToken = "mock-token";
    if (!accessToken) return;

    try {
      // Save to localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
      }

      // Save to backend
      await settingsApi.updateCompanySettings(companyInfo, accessToken);
      toast.success("회사 정보가 저장되었습니다");
    } catch (error: any) {
      console.error('Failed to save company info:', error);
      toast.error('회사 정보 저장에 실패했습니다');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <div className="flex items-center gap-2">
          <Lock className="w-8 h-8 text-primary" />
          <SettingsIcon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-foreground">설정</h1>
          <p className="text-muted-foreground">시스템 설정 및 관리자 기능</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {isAdmin && (
            <TabsTrigger value="users" className="gap-2">
              <Shield className="w-4 h-4" />
              화이트리스트
            </TabsTrigger>
          )}
          <TabsTrigger value="inquiry-types" className="gap-2">
            <Tag className="w-4 h-4" />
            문의유형
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="kpi" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              KPI
            </TabsTrigger>
          )}
          <TabsTrigger value="system" className="gap-2">
            <SettingsIcon className="w-4 h-4" />
            시스템
          </TabsTrigger>
        </TabsList>

        {/* Users Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      화이트리스트 관리
                    </CardTitle>
                    <CardDescription>
                      회원가입이 허용된 이메일 주소를 관리합니다
                    </CardDescription>
                  </div>
                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        이메일 추가
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>화이트리스트에 이메일 추가</DialogTitle>
                        <DialogDescription>
                          회원가입을 허용할 이메일 주소를 입력하세요
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="user-email">이메일</Label>
                          <Input
                            id="user-email"
                            type="email"
                            placeholder="user@company.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                          취소
                        </Button>
                        <Button onClick={handleAddUser}>추가</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingState message="화이트리스트를 불러오는 중..." />
                ) : whitelist.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 이메일이 없습니다
                  </div>
                ) : (
                  <div className="space-y-2">
                    {whitelist.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <span className="text-foreground">{email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(email)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Inquiry Types Tab */}
        <TabsContent value="inquiry-types" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>문의 유형 관리</CardTitle>
                  <CardDescription>
                    명함에 태그할 수 있는 문의 유형을 관리합니다
                  </CardDescription>
                </div>
                <Dialog open={isAddTypeOpen} onOpenChange={setIsAddTypeOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      유형 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>문의 유형 추가</DialogTitle>
                      <DialogDescription>
                        새로운 문의 유형을 추가합니다
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="type-value">값 (영문)</Label>
                        <Input
                          id="type-value"
                          placeholder="example"
                          value={typeForm.value}
                          onChange={(e) =>
                            setTypeForm({ ...typeForm, value: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type-label">표시 이름</Label>
                        <Input
                          id="type-label"
                          placeholder="예시"
                          value={typeForm.label}
                          onChange={(e) =>
                            setTypeForm({ ...typeForm, label: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddTypeOpen(false)}>
                        취소
                      </Button>
                      <Button onClick={handleAddInquiryType}>추가</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inquiryTypes.map((type) => (
                  <div
                    key={type.value}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <Badge variant="secondary">{type.label}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInquiryType(type.value)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KPI Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="kpi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                KPI 지표 설정
              </CardTitle>
              <CardDescription>
                리포트에 표시할 KPI 항목을 커스터마이즈합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-foreground mb-4">표시 항목</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="show-total-cards">총 명함 수</Label>
                    </div>
                    <Switch
                      id="show-total-cards"
                      checked={kpiSettings.showTotalCards}
                      onCheckedChange={(checked) =>
                        setKpiSettings({ ...kpiSettings, showTotalCards: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="show-monthly-cards">월별 명함 수</Label>
                    </div>
                    <Switch
                      id="show-monthly-cards"
                      checked={kpiSettings.showMonthlyCards}
                      onCheckedChange={(checked) =>
                        setKpiSettings({ ...kpiSettings, showMonthlyCards: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="show-ai-insights">AI 인사이트 수</Label>
                    </div>
                    <Switch
                      id="show-ai-insights"
                      checked={kpiSettings.showAIInsights}
                      onCheckedChange={(checked) =>
                        setKpiSettings({ ...kpiSettings, showAIInsights: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="show-industry">산업군 분포</Label>
                    </div>
                    <Switch
                      id="show-industry"
                      checked={kpiSettings.showIndustryDistribution}
                      onCheckedChange={(checked) =>
                        setKpiSettings({ ...kpiSettings, showIndustryDistribution: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="show-top-companies">주요 고객사</Label>
                    </div>
                    <Switch
                      id="show-top-companies"
                      checked={kpiSettings.showTopCompanies}
                      onCheckedChange={(checked) =>
                        setKpiSettings({ ...kpiSettings, showTopCompanies: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h4 className="text-foreground mb-4">목표 설정</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target-cards">월별 명함 등록 목표</Label>
                    <Input
                      id="target-cards"
                      type="number"
                      value={kpiSettings.targetCardsPerMonth}
                      onChange={(e) =>
                        setKpiSettings({ ...kpiSettings, targetCardsPerMonth: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-analysis">월별 AI 분석 목표</Label>
                    <Input
                      id="target-analysis"
                      type="number"
                      value={kpiSettings.targetAIAnalysis}
                      onChange={(e) =>
                        setKpiSettings({ ...kpiSettings, targetAIAnalysis: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={() => toast.success("KPI 설정이 저장되었습니다")}>
                설정 저장
              </Button>
            </CardContent>
          </Card>
          </TabsContent>
        )}

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                우리 회사 정보
              </CardTitle>
              <CardDescription>
                AI가 고객사 분석 시 우리 제품/솔루션과 연결하여 맞춤형 제안을 생성합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">회사명</Label>
                <Input
                  id="company-name"
                  placeholder="예: 테크솔루션즈"
                  value={companyInfo.companyName}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, companyName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vertical">산업 분야 (버티컬)</Label>
                <Select
                  value={companyInfo.vertical}
                  onValueChange={(value) =>
                    setCompanyInfo({ ...companyInfo, vertical: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="산업 분야를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {VERTICAL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-name">주요 제품/솔루션명</Label>
                <Input
                  id="product-name"
                  placeholder="예: 클라우드 기반 결제 솔루션, ERP 시스템"
                  value={companyInfo.productName}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, productName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">핵심 기능/특징</Label>
                <Textarea
                  id="features"
                  placeholder="예: API 통합, 실시간 데이터 분석, 클라우드 네이티브 아키텍처"
                  value={companyInfo.features}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, features: e.target.value })
                  }
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-industries">타겟 산업군</Label>
                <Input
                  id="target-industries"
                  placeholder="예: 제조, 유통, IT 서비스"
                  value={companyInfo.targetIndustries}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, targetIndustries: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposal-points">제안 포인트</Label>
                <Textarea
                  id="proposal-points"
                  placeholder="예: 비용 절감 30%, 업무 효율성 향상, 24/7 기술 지원"
                  value={companyInfo.proposalPoints}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, proposalPoints: e.target.value })
                  }
                  className="min-h-[80px]"
                />
              </div>

              <Button className="w-full" onClick={handleSaveCompanyInfo}>
                회사 정보 저장
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI 모델 설정
              </CardTitle>
              <CardDescription>AI 분석에 사용할 모델을 선택합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-model">AI 모델</Label>
                <Select
                  value={systemSettings.aiModel}
                  onValueChange={(value) =>
                    setSystemSettings({ ...systemSettings, aiModel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4 (추천)</SelectItem>
                    <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude">Claude 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="auto-analysis">자동 분석</Label>
                  <p className="text-muted-foreground">
                    명함 저장 시 자동으로 AI 인사이트 생성
                  </p>
                </div>
                <Switch
                  id="auto-analysis"
                  checked={systemSettings.autoAnalysis}
                  onCheckedChange={(checked) =>
                    setSystemSettings({ ...systemSettings, autoAnalysis: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>일반 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">언어</Label>
                <Select
                  value={systemSettings.language}
                  onValueChange={(value) =>
                    setSystemSettings({ ...systemSettings, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="email-notifications">이메일 알림</Label>
                  <p className="text-muted-foreground">
                    중요 이벤트 발생 시 이메일 알림 수신
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={systemSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSystemSettings({ ...systemSettings, emailNotifications: checked })
                  }
                />
              </div>

              <Button className="w-full" onClick={() => toast.success("시스템 설정이 저장되었습니다")}>
                설정 저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
