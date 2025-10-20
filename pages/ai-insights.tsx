"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { LoadingState } from "../components/LoadingState";
import {
  Sparkles,
  Building2,
  Lightbulb,
  AlertCircle,
  Target,
  Search,
  Pencil,
  Save,
  X,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { toast } from "sonner";
import { MOCK_CARDS, getVerticalLabel } from "../constants/data";
import { getPriorityColor } from "../utils/helpers";
import { matchesChosung, getSearchScore } from "../utils/korean";

interface AIInsightsPageProps {
  onNavigate?: (page: string) => void;
}

export default function AIInsights({ onNavigate }: AIInsightsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editableData, setEditableData] = useState({
    overview: "",
    industry: "",
    employees: "",
    founded: "",
    website: "",
  });

  // Load company info from localStorage
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

  // Load contacts data
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      console.log('=== Loading contacts for AI insights ===');
      
      const response = await fetch('/api/contacts');
      const result = await response.json();
      
      console.log('Contacts API response:', result);
      console.log('Contacts count:', result.contacts?.length || 0);
      console.log('Sample contact:', result.contacts?.[0]);
      
      if (result.ok && result.contacts) {
        setContacts(result.contacts);
        console.log('Contacts loaded successfully:', result.contacts.length);
      } else {
        console.error('Failed to load contacts:', result.error);
        toast.error(result.error || '연락처 목록을 불러오는데 실패했습니다');
        setContacts([]);
      }
    } catch (error: any) {
      console.error('Failed to load contacts:', error);
      toast.error('연락처 목록을 불러오는데 실패했습니다');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };



  // 회사 목록 (중복 제거) - 실제 데이터 사용
  const companies = Array.from(new Set(contacts.map(contact => contact.company).filter(Boolean))).map(company => {
    return {
      value: company,
      label: company,
      contacts: contacts.filter(c => c.company === company).length,
    };
  });

  // 디버깅을 위한 로그
  console.log('=== AI Insights Debug Info ===');
  console.log('Contacts state:', contacts);
  console.log('Companies derived:', companies);
  console.log('Loading state:', loading);

  // 검색 필터링된 회사 목록 (정확도 순으로 정렬)
  const filteredCompanies = companies
    .filter(company => matchesChosung(company.label, searchQuery))
    .map(company => ({
      ...company,
      searchScore: getSearchScore(company.label, searchQuery)
    }))
    .sort((a, b) => b.searchScore - a.searchScore);

  // 자동완성 제안 (상위 5개)
  const suggestions = filteredCompanies.slice(0, 5);

  // Mock AI 분석 결과
  const [analysisResult, setAnalysisResult] = useState({
    company: "테크코퍼레이션",
    overview:
      "테크코퍼레이션은 엔터프라이즈급 B2B SaaS 솔루션을 전문으로 하는 중견 소프트웨어 개발 회사입니다. 특히 클라우드 기반 협업 도구와 데이터 분석 플랫폼 개발에 강점을 보이고 있으며, 최근 3년간 연평균 40% 이상의 성장률을 기록하고 있습니다.",
    industry: "소프트웨어 개발",
    employees: "50-100명",
    founded: "2015년",
    website: "www.techcorp.com",
    opportunities: [
      {
        id: 1,
        title: "API 통합 파트너십",
        description: "당사의 결제 솔루션과 테크코퍼레이션의 협업 플랫폼 통합 가능성",
        priority: "high",
        impact: "높음",
        timeline: "1-2개월",
      },
      {
        id: 2,
        title: "공동 마케팅 캠페인",
        description: "B2B 시장 타겟 공동 마케팅을 통한 시장 점유율 확대",
        priority: "medium",
        impact: "중간",
        timeline: "3-4개월",
      },
      {
        id: 3,
        title: "기술 자문 및 컨설팅",
        description: "클라우드 인프라 최적화 컨설팅 서비스 제공 기회",
        priority: "medium",
        impact: "중간",
        timeline: "즉시 가능",
      },
    ],
    proposalPoints: [
      "클라우드 네이티브 아키텍처 경험을 활용한 시너지",
      "B2B SaaS 고객층 공유를 통한 크로스셀링 기회",
      "데이터 분석 역량 강화를 위한 AI/ML 통합 제안",
    ],
  });

  const handleAnalyze = async (company: string) => {
    setSelectedCompany(company);
    setSearchQuery("");
    setIsAnalyzing(true);
    
    try {
      console.log('Starting AI analysis for:', company);
      
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: company })
      });
      
      const result = await response.json();
      
      console.log('AI Analysis response:', result);
      
      if (result.ok && result.analysis) {
        setAnalysisResult(result.analysis);
        setHasResult(true);
        
        // AI 분석 결과를 히스토리에 저장
        try {
          const saveResponse = await fetch('/api/ai-analysis/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              companyName: company, 
              analysis: result.analysis 
            })
          });
          
          const saveResult = await saveResponse.json();
          
          if (saveResult.ok) {
            toast.success("AI 분석이 완료되고 히스토리에 저장되었습니다");
          } else {
            toast.success("AI 분석이 완료되었습니다 (히스토리 저장 실패)");
          }
        } catch (saveError) {
          console.error('Save analysis error:', saveError);
          toast.success("AI 분석이 완료되었습니다 (히스토리 저장 실패)");
        }
      } else {
        console.error('AI Analysis failed:', result.error);
        if (result.error?.includes('No contacts found')) {
          toast.error("해당 회사의 연락처 정보가 없습니다");
        } else {
          toast.error(result.error || "AI 분석에 실패했습니다");
        }
      }
    } catch (error: any) {
      console.error('AI Analysis error:', error);
      
      // 더 구체적인 에러 메시지 표시
      if (error.message?.includes('Failed to fetch')) {
        toast.error("서버 연결에 실패했습니다. 네트워크를 확인해주세요.");
      } else if (error.message?.includes('API key')) {
        toast.error("AI 서비스 설정에 문제가 있습니다.");
      } else {
        toast.error(`AI 분석 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEdit = () => {
    setEditableData({
      overview: analysisResult.overview,
      industry: analysisResult.industry,
      employees: analysisResult.employees,
      founded: analysisResult.founded,
      website: analysisResult.website,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    setAnalysisResult({
      ...analysisResult,
      overview: editableData.overview,
      industry: editableData.industry,
      employees: editableData.employees,
      founded: editableData.founded,
      website: editableData.website,
    });
    setIsEditing(false);
    toast.success("변경사항이 저장되었습니다");
  };

  const handleCancel = () => {
    setIsEditing(false);
    toast.info("편집이 취소되었습니다");
  };

  const handleReanalyze = async () => {
    if (!selectedCompany) return;
    
    setIsAnalyzing(true);
    setIsEditing(false);
    toast.info("다시 분석 중입니다...");
    
    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: selectedCompany })
      });
      
      const result = await response.json();
      
      if (result.ok && result.analysis) {
        setAnalysisResult(result.analysis);
        setHasResult(true);
        
        // AI 재분석 결과를 히스토리에 저장
        try {
          const saveResponse = await fetch('/api/ai-analysis/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              companyName: selectedCompany, 
              analysis: result.analysis 
            })
          });
          
          const saveResult = await saveResponse.json();
          
          if (saveResult.ok) {
            toast.success("AI 재분석이 완료되고 히스토리에 저장되었습니다");
          } else {
            toast.success("AI 재분석이 완료되었습니다 (히스토리 저장 실패)");
          }
        } catch (saveError) {
          console.error('Save reanalysis error:', saveError);
          toast.success("AI 재분석이 완료되었습니다 (히스토리 저장 실패)");
        }
      } else {
        if (result.error?.includes('No contacts found')) {
          toast.error("해당 회사의 연락처 정보가 없습니다");
        } else {
          toast.error(result.error || "AI 재분석에 실패했습니다");
        }
      }
    } catch (error: any) {
      console.error('AI Reanalysis error:', error);
      toast.error("AI 재분석 중 오류가 발생했습니다");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-foreground">AI 인사이트</h1>
        </div>
        <p className="text-muted-foreground">
          고객사 정보를 AI가 분석하여 비즈니스 기회를 제안합니다
        </p>
        
        {/* 디버깅 정보 표시 */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          로드된 연락처: {contacts.length}개 | 회사: {companies.length}개
          {companies.length > 0 && (
            <div className="mt-1">
              회사 목록: {companies.map(c => c.label).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Company Search */}
      <Card>
        <CardHeader>
          <CardTitle>회사 검색</CardTitle>
          <CardDescription>회사명 또는 초성으로 검색하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="회사명 검색... (예: 삼성, 네이버, 카카오)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => {
                setIsFocused(true);
                setShowSuggestions(searchQuery.length > 0);
              }}
              onBlur={() => setTimeout(() => {
                setIsFocused(false);
                setShowSuggestions(false);
              }, 200)}
              className="pl-10"
            />
            
            {/* 자동완성 제안 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                {suggestions.map((company) => (
                  <div
                    key={company.value}
                    className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0"
                    onClick={() => {
                      setSearchQuery(company.label);
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{company.label}</p>
                        <p className="text-sm text-muted-foreground">
                          등록된 명함 {company.contacts}명
                        </p>
                      </div>
                      {company.searchScore > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {company.searchScore}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Results */}
          {isFocused && (
            <div className="border border-border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  연락처 목록을 불러오는 중...
                </div>
              ) : filteredCompanies.length > 0 ? (
                <div className="divide-y divide-border">
                  {filteredCompanies.map((company) => (
                    <div
                      key={company.value}
                      className="w-full p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                    >
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => handleAnalyze(company.value)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-foreground">{company.label}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-muted-foreground">
                              등록된 명함 {company.contacts}명
                            </p>
                            {searchQuery && company.searchScore > 0 && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                              >
                                정확도 {company.searchScore}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => handleAnalyze(company.value)}
                      >
                        <Sparkles className="w-4 h-4" />
                        분석하기
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground space-y-2">
                  <p>검색 결과가 없습니다</p>
                  <p className="text-sm">
                    다른 키워드로 검색하거나 초성으로 검색해보세요
                  </p>
                  <div className="text-xs space-y-1 mt-3">
                    <p>💡 검색 팁:</p>
                    <p>• "삼성" → "삼성전자", "삼성SDS" 등</p>
                    <p>• "ㅅㅅ" → "삼성"으로 시작하는 회사들</p>
                    <p>• "네이버" → "NAVER", "네이버(주)" 등</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected Company Display */}
          {selectedCompany && !isFocused && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground">{selectedCompany}</p>
                  <p className="text-muted-foreground mt-1">
                    등록된 명함: {companies.find(c => c.value === selectedCompany)?.contacts}명
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Helper Text */}
          {!isFocused && !selectedCompany && (
            <div className="text-center p-8 text-muted-foreground space-y-2">
              <Building2 className="w-12 h-12 mx-auto opacity-50 mb-4" />
              <p>검색창을 클릭하여 회사를 검색하세요</p>
              <p>초성 검색도 가능합니다</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Result */}
      {isAnalyzing && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <div className="space-y-2">
                <p className="text-foreground font-medium">AI가 회사 정보를 분석하고 있습니다...</p>
                <p className="text-muted-foreground text-sm">
                  ChatGPT가 {selectedCompany}의 명함 정보를 바탕으로 비즈니스 기회를 분석 중입니다.
                </p>
                <p className="text-xs text-muted-foreground">
                  분석에는 10-30초 정도 소요될 수 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasResult && !isAnalyzing && (
        <>
          {/* Company Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    회사 개요
                  </CardTitle>
                  <CardDescription className="mt-2">
                    AI가 분석한 {analysisResult.company} 정보
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    2025-10-18 분석
                  </span>
                  {!isEditing ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEdit}
                      className="gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      편집
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="gap-2"
                      >
                        <Save className="w-4 h-4" />
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        취소
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  아래 분석은 ChatGPT가 생성한 내용으로, 실제와 다를 수 있습니다. 
                  등록된 명함 정보를 바탕으로 AI가 추정한 내용입니다.
                </AlertDescription>
              </Alert>
              
              {isEditing ? (
                <Textarea
                  value={editableData.overview}
                  onChange={(e) =>
                    setEditableData({ ...editableData, overview: e.target.value })
                  }
                  className="mb-4 min-h-[120px]"
                  placeholder="회사 개요를 입력하세요"
                />
              ) : (
                <p className="text-foreground leading-relaxed mb-4">
                  {analysisResult.overview}
                </p>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground mb-1">산업</p>
                  {isEditing ? (
                    <Input
                      value={editableData.industry}
                      onChange={(e) =>
                        setEditableData({ ...editableData, industry: e.target.value })
                      }
                      placeholder="산업"
                    />
                  ) : (
                    <p className="text-foreground">{analysisResult.industry}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground mb-1">직원 수</p>
                  {isEditing ? (
                    <Input
                      value={editableData.employees}
                      onChange={(e) =>
                        setEditableData({ ...editableData, employees: e.target.value })
                      }
                      placeholder="직원 수"
                    />
                  ) : (
                    <p className="text-foreground">{analysisResult.employees}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground mb-1">설립연도</p>
                  {isEditing ? (
                    <Input
                      value={editableData.founded}
                      onChange={(e) =>
                        setEditableData({ ...editableData, founded: e.target.value })
                      }
                      placeholder="설립연도"
                    />
                  ) : (
                    <p className="text-foreground">{analysisResult.founded}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground mb-1">웹사이트</p>
                  {isEditing ? (
                    <Input
                      value={editableData.website}
                      onChange={(e) =>
                        setEditableData({ ...editableData, website: e.target.value })
                      }
                      placeholder="웹사이트"
                    />
                  ) : (
                    <a
                      href={analysisResult.website.startsWith('http') ? analysisResult.website : `https://${analysisResult.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline cursor-pointer"
                    >
                      {analysisResult.website}
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-accent" />
                비즈니스 기회
              </CardTitle>
              <CardDescription>
                {companyInfo.productName 
                  ? `${companyInfo.productName}와(과) 연계한 협업 가능성 및 제안 사항`
                  : "AI가 분석한 협업 가능성 및 제안 사항"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!companyInfo.productName && (
                <Alert className="mb-4">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      우리 회사 정보를 등록하면 더 맞춤화된 제안을 받을 수 있습니다
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate && onNavigate("/settings")}
                      className="ml-2"
                    >
                      설정하기
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {companyInfo.productName && (
                <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-foreground">
                          {companyInfo.companyName && `${companyInfo.companyName} - `}
                          {companyInfo.productName}
                        </h4>
                        {companyInfo.vertical && (
                          <Badge variant="outline" className="border-primary/30 text-primary">
                            {getVerticalLabel(companyInfo.vertical)}
                          </Badge>
                        )}
                      </div>
                      {companyInfo.features && (
                        <p className="text-muted-foreground mb-2">
                          <span className="text-foreground">핵심 기능:</span> {companyInfo.features}
                        </p>
                      )}
                      {companyInfo.targetIndustries && (
                        <p className="text-muted-foreground mb-2">
                          <span className="text-foreground">타겟 산업:</span> {companyInfo.targetIndustries}
                        </p>
                      )}
                      {companyInfo.proposalPoints && (
                        <p className="text-muted-foreground">
                          <span className="text-foreground">제안 포인트:</span> {companyInfo.proposalPoints}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {analysisResult.opportunities.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-foreground">{opportunity.title}</h3>
                      <Badge className={getPriorityColor(opportunity.priority)}>
                        {opportunity.impact}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{opportunity.description}</p>
                    {companyInfo.productName && (
                      <div className="mb-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                        <p className="text-foreground mb-1">우리 제품과의 연결점</p>
                        <p className="text-muted-foreground">
                          {companyInfo.productName}의 {companyInfo.features || "핵심 기능"}을(를) 활용하여 
                          고객사의 {opportunity.title.toLowerCase()}에 대한 니즈를 효과적으로 해결할 수 있습니다.
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{opportunity.timeline}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Proposal Points */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                제안 포인트
              </CardTitle>
              <CardDescription>영업 접근 시 활용할 수 있는 핵심 요소</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysisResult.proposalPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary">{index + 1}</span>
                    </div>
                    <p className="text-foreground flex-1">{point}</p>
                  </li>
                ))}
              </ul>
              
              <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleReanalyze}
                >
                  <RotateCcw className="w-4 h-4" />
                  삭제하고 다시 분석하기
                </Button>
                <Button className="flex-1">
                  히스토리에 저장
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
