"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { toast } from "sonner";
import { MOCK_CARDS, getVerticalLabel } from "../constants/data";
import { getPriorityColor } from "../utils/helpers";
import { matchesChosung, getSearchScore } from "../utils/korean";

interface AIInsightsPageProps {
  onNavigate?: (page: string) => void;
  companyName?: string;
  analysisData?: string;
  fromHistory?: string;
  fromCustomer?: string;
}

export default function AIInsights({ onNavigate, companyName, analysisData, fromHistory, fromCustomer }: AIInsightsPageProps) {
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
    solutions: "",
    employees: "",
    founded: "",
    website: "",
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isGeneratingProposals, setIsGeneratingProposals] = useState(false);

  // 제안 제품 목록
  const availableProducts = [
    "산업용 컴퓨터",
    "AI 컴퓨터", 
    "네트워크 장비",
    "서버",
    "컴퓨터 모니터링 S/W"
  ];

  // 제안 제품 선택 핸들러
  const handleProductToggle = (product: string) => {
    setSelectedProducts(prev => 
      prev.includes(product) 
        ? prev.filter(p => p !== product)
        : [...prev, product]
    );
  };

  // 제안 포인트 생성 함수
  const handleGenerateProposals = async () => {
    if (selectedProducts.length === 0) {
      toast.error("제안할 제품을 선택해주세요.");
      return;
    }

    setIsGeneratingProposals(true);
    
    try {
      const response = await fetch('/api/ai-analysis/generate-proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          companyName: selectedCompany,
          selectedProducts: selectedProducts,
          companyInfo: analysisResult,
          recentNews: analysisResult.recentNews
        })
      });
      
      const result = await response.json();
      
      if (result.ok && result.proposals && Array.isArray(result.proposals)) {
        // 각 제안 포인트가 올바른 구조를 가지고 있는지 확인
        const validProposals = result.proposals.filter((proposal: any) => 
          proposal && 
          typeof proposal === 'object' && 
          proposal.title && 
          proposal.description && 
          proposal.solution
        );
        
        console.log('=== Valid Proposals Debug ===');
        console.log('Valid proposals:', validProposals);
        console.log('Valid proposals type:', typeof validProposals);
        console.log('Valid proposals is array:', Array.isArray(validProposals));
        
        setAnalysisResult(prev => ({
          ...prev,
          proposalPoints: Array.isArray(validProposals) ? validProposals : []
        }));
        toast.success("제안 포인트가 생성되었습니다.");
      } else {
        toast.error("제안 포인트 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error('Generate proposals error:', error);
      toast.error("제안 포인트 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingProposals(false);
    }
  };

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



  // 회사 목록 (중복 제거) - 실제 데이터 사용 - 메모이제이션으로 성능 최적화
  const companies = useMemo(() => {
    return Array.from(new Set(contacts.map(contact => contact.company).filter(Boolean))).map(company => {
      return {
        value: company,
        label: company,
        contacts: contacts.filter(c => c.company === company).length,
      };
    });
  }, [contacts]);

  // 디버깅을 위한 로그
  console.log('=== AI Insights Debug Info ===');
  console.log('Contacts state:', contacts);
  console.log('Companies derived:', companies);
  console.log('Loading state:', loading);

  // 검색 필터링된 회사 목록 (정확도 순으로 정렬) - 메모이제이션으로 성능 최적화
  const filteredCompanies = useMemo(() => {
    return companies
      .filter(company => matchesChosung(company.label, searchQuery))
      .map(company => ({
        ...company,
        searchScore: getSearchScore(company.label, searchQuery)
      }))
      .sort((a, b) => b.searchScore - a.searchScore);
  }, [companies, searchQuery]);

  // 자동완성 제안 (상위 5개) - 메모이제이션으로 성능 최적화
  const suggestions = useMemo(() => {
    return filteredCompanies.slice(0, 5);
  }, [filteredCompanies]);


  // Mock AI 분석 결과
  const [analysisResult, setAnalysisResult] = useState({
    company: "테크코퍼레이션",
    overview: "테크코퍼레이션은 엔터프라이즈급 B2B SaaS 솔루션을 전문으로 하는 중견 소프트웨어 개발 회사입니다. 특히 클라우드 기반 협업 도구와 데이터 분석 플랫폼 개발에 강점을 보이고 있으며, 최근 3년간 연평균 40% 이상의 성장률을 기록하고 있습니다.",
    industry: "소프트웨어 개발",
    solutions: ["클라우드 협업 도구", "데이터 분석 플랫폼", "B2B SaaS 솔루션"],
    employees: "50-100명",
    founded: "2015년",
    website: "www.techcorp.com",
    sources: ["https://www.techcorp.com"],
    sourceDetails: {
      overview: "공식 홈페이지",
      industry: "공식 홈페이지",
      employees: "공식 홈페이지",
      founded: "공식 홈페이지"
    },
    recentNews: [
      {
        id: 1,
        title: "테크코퍼레이션, 클라우드 협업 플랫폼 신버전 출시",
        description: "AI 기반 스마트 협업 기능을 추가한 새로운 버전을 출시하여 업계 주목",
        date: "2024년 10월",
        source: "IT뉴스",
        link: "https://itnews.example.com/techcorp-new-version"
      },
      {
        id: 2,
        title: "테크코퍼레이션, 시리즈 B 투자 유치 성공",
        description: "데이터 분석 플랫폼 확장을 위한 50억원 규모의 투자 유치",
        date: "2024년 9월",
        source: "벤처스퀘어",
        link: "https://venturesquare.example.com/techcorp-series-b"
      },
      {
        id: 3,
        title: "테크코퍼레이션, 대기업과 전략적 파트너십 체결",
        description: "글로벌 기업과의 협업을 통한 해외 시장 진출 계획 발표",
        date: "2024년 8월",
        source: "디지털데일리",
        link: "https://digitaldaily.example.com/techcorp-partnership"
      }
    ],
    proposalPoints: [] as Array<{
      id: number;
      title: string;
      description: string;
      solution: string;
    }>,
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
        console.log('=== AI Analysis Result Debug ===');
        console.log('Full analysis result:', result.analysis);
        console.log('Solutions type:', typeof result.analysis.solutions);
        console.log('Solutions value:', result.analysis.solutions);
        console.log('RecentNews type:', typeof result.analysis.recentNews);
        console.log('RecentNews value:', result.analysis.recentNews);
        console.log('ProposalPoints type:', typeof result.analysis.proposalPoints);
        console.log('ProposalPoints value:', result.analysis.proposalPoints);
        
        // 안전하게 데이터 처리
        const safeAnalysis = {
          company: result.analysis.company || '회사명 없음',
          overview: result.analysis.overview || '분석 정보가 없습니다.',
          industry: result.analysis.industry || '정보 없음',
          solutions: Array.isArray(result.analysis.solutions) ? result.analysis.solutions : [],
          employees: result.analysis.employees || '정보 없음',
          founded: result.analysis.founded || '정보 없음',
          website: result.analysis.website || '정보 없음',
          sources: Array.isArray(result.analysis.sources) ? result.analysis.sources : [],
          sourceDetails: result.analysis.sourceDetails || {
            overview: "정보가 제한적",
            industry: "정보가 제한적",
            employees: "정보가 제한적",
            founded: "정보가 제한적"
          },
          recentNews: Array.isArray(result.analysis.recentNews) ? result.analysis.recentNews : [],
          proposalPoints: Array.isArray(result.analysis.proposalPoints) ? result.analysis.proposalPoints : []
        };
        
        setAnalysisResult(safeAnalysis);
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

  // Handle company name and analysis data from URL parameter
  useEffect(() => {
    if (companyName && contacts.length > 0) {
      const decodedCompanyName = decodeURIComponent(companyName);
      setSelectedCompany(decodedCompanyName);
      setSearchQuery(decodedCompanyName);
      
      // 히스토리 또는 고객 목록에서 온 경우 기존 분석 데이터 사용
      if ((fromHistory === 'true' || fromCustomer === 'true') && analysisData) {
        try {
          const decodedAnalysisData = JSON.parse(decodeURIComponent(analysisData));
          console.log('Loading analysis data:', decodedAnalysisData);
          
          // 안전하게 데이터 처리
          const safeAnalysis = {
            company: decodedAnalysisData.company || decodedCompanyName,
            overview: decodedAnalysisData.overview || '분석 정보가 없습니다.',
            industry: decodedAnalysisData.industry || '정보 없음',
            solutions: Array.isArray(decodedAnalysisData.solutions) ? decodedAnalysisData.solutions : [],
            employees: decodedAnalysisData.employees || '정보 없음',
            founded: decodedAnalysisData.founded || '정보 없음',
            website: decodedAnalysisData.website || '정보 없음',
            sources: Array.isArray(decodedAnalysisData.sources) ? decodedAnalysisData.sources : [],
            sourceDetails: decodedAnalysisData.sourceDetails || {
              overview: "정보가 제한적",
              industry: "정보가 제한적",
              employees: "정보가 제한적",
              founded: "정보가 제한적"
            },
            recentNews: Array.isArray(decodedAnalysisData.recentNews) ? decodedAnalysisData.recentNews : [],
            proposalPoints: Array.isArray(decodedAnalysisData.proposalPoints) ? decodedAnalysisData.proposalPoints : []
          };
          
          setAnalysisResult(safeAnalysis);
          setHasResult(true);
          
          if (fromHistory === 'true') {
            toast.success("히스토리에서 분석 결과를 불러왔습니다");
          } else if (fromCustomer === 'true') {
            toast.success("고객 목록에서 분석 결과를 불러왔습니다");
          }
        } catch (error) {
          console.error('Failed to parse analysis data:', error);
          toast.error("분석 데이터를 불러오는데 실패했습니다");
        }
      } else {
        // 일반적인 경우 새로 분석 실행 - contacts에서 직접 확인
        const companyExists = contacts.some(c => c.company === decodedCompanyName);
        if (companyExists) {
          handleAnalyze(decodedCompanyName);
        } else {
          toast.error(`"${decodedCompanyName}" 회사의 연락처 정보가 없습니다`);
        }
      }
    }
  }, [companyName, contacts, analysisData, fromHistory, fromCustomer]);

  const handleEdit = () => {
    setEditableData({
      overview: analysisResult.overview,
      industry: analysisResult.industry,
      solutions: Array.isArray(analysisResult.solutions) ? analysisResult.solutions.join(', ') : '',
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
      solutions: editableData.solutions ? editableData.solutions.split(',').map(s => s.trim()) : [],
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
        // 안전하게 데이터 처리
        const safeAnalysis = {
          company: result.analysis.company || '회사명 없음',
          overview: result.analysis.overview || '분석 정보가 없습니다.',
          industry: result.analysis.industry || '정보 없음',
          solutions: Array.isArray(result.analysis.solutions) ? result.analysis.solutions : [],
          employees: result.analysis.employees || '정보 없음',
          founded: result.analysis.founded || '정보 없음',
          website: result.analysis.website || '정보 없음',
          sources: Array.isArray(result.analysis.sources) ? result.analysis.sources : [],
          sourceDetails: result.analysis.sourceDetails || {
            overview: "정보가 제한적",
            industry: "정보가 제한적",
            employees: "정보가 제한적",
            founded: "정보가 제한적"
          },
          recentNews: Array.isArray(result.analysis.recentNews) ? result.analysis.recentNews : [],
          proposalPoints: Array.isArray(result.analysis.proposalPoints) ? result.analysis.proposalPoints : []
        };
        
        setAnalysisResult(safeAnalysis);
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

  const handleSaveToHistory = async () => {
    if (!selectedCompany || !analysisResult) {
      toast.error("저장할 분석 결과가 없습니다");
      return;
    }
    
    try {
      // 1. 히스토리에 저장
      const saveResponse = await fetch('/api/ai-analysis/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          companyName: selectedCompany, 
          analysis: analysisResult 
        })
      });
      
      const saveResult = await saveResponse.json();
      
      if (!saveResult.ok) {
        toast.error(saveResult.error || "히스토리 저장에 실패했습니다");
        return;
      }

      // 2. 고객 정보에 AI 분석 결과 적용
      const applyResponse = await fetch('/api/ai-analysis/apply-to-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          companyName: selectedCompany, 
          analysis: analysisResult 
        })
      });
      
      const applyResult = await applyResponse.json();
      
      if (applyResult.ok) {
        toast.success("분석 결과가 히스토리에 저장되었습니다");
      } else {
        toast.success("분석 결과가 히스토리에 저장되었습니다");
      }
    } catch (error: any) {
      console.error('Save to history error:', error);
      toast.error("히스토리 저장 중 오류가 발생했습니다");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-foreground">AI 인사이트</h1>
          {fromHistory === 'true' && (
            <Badge variant="secondary" className="ml-2">
              히스토리에서 불러옴
            </Badge>
          )}
          {fromCustomer === 'true' && (
            <Badge variant="secondary" className="ml-2">
              고객 목록에서 불러옴
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          고객사 정보를 AI가 분석하여 비즈니스 기회를 제안합니다
        </p>
        
        {/* 히스토리 버튼 */}
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate && onNavigate("/ai-history")}
            className="gap-2"
          >
            <Clock className="w-4 h-4" />
            AI 분석 히스토리
          </Button>
        </div>
        
        {/* 디버깅 정보 표시 */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          로드된 연락처: {contacts.length}개 | 회사: {companies.length}개
          {companies.length > 0 && (
            <div className="mt-1">
              회사 목록: {companies.map(c => String(c.label || '')).filter(Boolean).join(', ')}
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
                        <p className="font-medium text-foreground">{String(company.label || '회사명 없음')}</p>
                        <p className="text-sm text-muted-foreground">
                          등록된 명함 {company.contacts || 0}명
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
                          <p className="text-foreground">{String(company.label || '회사명 없음')}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-muted-foreground">
                              등록된 명함 {company.contacts || 0}명
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
                  <p className="text-foreground">{String(selectedCompany || '회사명 없음')}</p>
                  <p className="text-muted-foreground mt-1">
                    등록된 명함: {companies.find(c => c.value === selectedCompany)?.contacts || 0}명
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
                    AI가 분석한 {String(analysisResult.company || '회사')} 정보
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
                  {String(analysisResult.overview || '분석 정보가 없습니다.')}
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
                    <p className="text-foreground">{String(analysisResult.industry || '정보 없음')}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground mb-1">주요 솔루션</p>
                  {isEditing ? (
                    <Input
                      value={editableData.solutions || (Array.isArray(analysisResult.solutions) ? analysisResult.solutions.join(', ') : '') || ''}
                      onChange={(e) =>
                        setEditableData({ ...editableData, solutions: e.target.value })
                      }
                      placeholder="솔루션 (쉼표로 구분)"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(analysisResult.solutions) ? 
                        analysisResult.solutions.map((solution, index) => {
                          // solution이 객체인 경우 title 속성을 사용하거나 안전하게 문자열로 변환
                          let solutionText = '';
                          if (typeof solution === 'string') {
                            solutionText = solution;
                          } else if (solution && typeof solution === 'object' && (solution as any).title) {
                            solutionText = String((solution as any).title);
                          } else if (solution && typeof solution === 'object' && (solution as any).name) {
                            solutionText = String((solution as any).name);
                          } else {
                            solutionText = '솔루션 정보';
                          }
                          
                          return (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {solutionText}
                            </Badge>
                          );
                        }) : 
                        <Badge variant="secondary" className="text-xs">
                          {typeof analysisResult.solutions === 'string' ? analysisResult.solutions : '정보 없음'}
                        </Badge>
                      }
                    </div>
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
                    <p className="text-foreground">{String(analysisResult.employees || '정보 없음')}</p>
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
                    <p className="text-foreground">{String(analysisResult.founded || '정보 없음')}</p>
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
                      href={analysisResult.website && analysisResult.website.startsWith('http') ? analysisResult.website : `https://${analysisResult.website || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline cursor-pointer"
                    >
                      {String(analysisResult.website || '정보 없음')}
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Sources */}
          {analysisResult.sources && Array.isArray(analysisResult.sources) && analysisResult.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-500" />
                  정보 출처
                </CardTitle>
                <CardDescription>
                  AI 분석에 참고된 웹 검색 결과입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisResult.sources
                    .filter(source => source && typeof source === 'string' && source.trim() !== '')
                    .map((source, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <Badge variant="outline" className="text-xs">
                        {index + 1}
                      </Badge>
                      <a
                        href={source.startsWith('http') ? source : `https://${source}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline cursor-pointer text-sm flex-1 truncate"
                        title={source}
                      >
                        {source}
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent News */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-accent" />
                최근 뉴스
              </CardTitle>
              <CardDescription>
                {String(analysisResult.company || '회사')}의 최근 6개월 내 주목할만한 뉴스입니다
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
                          {companyInfo.productName || '제품명 없음'}
                        </h4>
                        {companyInfo.vertical && (
                          <Badge variant="outline" className="border-primary/30 text-primary">
                            {getVerticalLabel(companyInfo.vertical) || companyInfo.vertical}
                          </Badge>
                        )}
                      </div>
                      {companyInfo.features && (
                        <p className="text-muted-foreground mb-2">
                          <span className="text-foreground">핵심 기능:</span> {companyInfo.features || '정보 없음'}
                        </p>
                      )}
                      {companyInfo.targetIndustries && (
                        <p className="text-muted-foreground mb-2">
                          <span className="text-foreground">타겟 산업:</span> {companyInfo.targetIndustries || '정보 없음'}
                        </p>
                      )}
                      {companyInfo.proposalPoints && (
                        <p className="text-muted-foreground">
                          <span className="text-foreground">제안 포인트:</span> {typeof companyInfo.proposalPoints === 'string' ? companyInfo.proposalPoints : '정보 없음'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {Array.isArray(analysisResult.recentNews) && analysisResult.recentNews.length > 0 && 
                 !analysisResult.recentNews.every(news => news && news.title === "최근 뉴스 정보 없음" || news.title === "뉴스 없음") ? (
                  analysisResult.recentNews.map((news, index) => {
                    // news가 유효한 객체인지 확인
                    if (!news || typeof news !== 'object') {
                      return null;
                    }
                    
                    // 각 속성을 안전하게 문자열로 변환
                    const title = news.title ? String(news.title) : '제목 없음';
                    const description = news.description ? String(news.description) : '설명 없음';
                    const date = news.date ? String(news.date) : '날짜 없음';
                    const source = news.source ? String(news.source) : '출처 없음';
                    const link = news.link ? String(news.link) : null;
                    
                    return (
                      <div
                        key={news.id || index}
                        className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-foreground">
                            {link && link !== '정보 없음' ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline cursor-pointer"
                              >
                                {title}
                              </a>
                            ) : (
                              title
                            )}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {date}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3">
                          {description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>출처: {source}</span>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)
                ) : (
                  <div className="p-4 rounded-lg border border-border bg-muted/50">
                    <p className="text-sm text-muted-foreground text-center">
                      관련 뉴스가 없습니다.
                    </p>
                  </div>
                )}
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
              <CardDescription>우리 회사 솔루션을 근거로 한 맞춤형 제안 사항</CardDescription>
            </CardHeader>
            <CardContent>
              {/* 제안 제품 선택 */}
              <div className="mb-6">
                <h4 className="font-semibold text-foreground mb-3">제안할 제품 선택</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {availableProducts.map((product) => (
                    <Button
                      key={product}
                      variant={selectedProducts.includes(product) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleProductToggle(product)}
                      className="text-sm"
                    >
                      {product}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={handleGenerateProposals}
                  disabled={selectedProducts.length === 0 || isGeneratingProposals}
                  className="w-full"
                >
                  {isGeneratingProposals ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      제안 포인트 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      제안 포인트 생성하기
                    </>
                  )}
                </Button>
              </div>

              {/* 제안 포인트 결과 */}
              <div className="space-y-4">
                {(() => {
                  // proposalPoints를 안전하게 처리
                  const proposalPoints = analysisResult.proposalPoints;
                  
                  console.log('=== Proposal Points Debug ===');
                  console.log('ProposalPoints:', proposalPoints);
                  console.log('Type:', typeof proposalPoints);
                  console.log('Is Array:', Array.isArray(proposalPoints));
                  
                  if (!proposalPoints || !Array.isArray(proposalPoints) || proposalPoints.length === 0) {
                    return (
                      <div className="p-4 rounded-lg border border-border bg-muted/50">
                        <p className="text-sm text-muted-foreground text-center">
                          제안할 제품을 선택하고 "제안 포인트 생성하기" 버튼을 클릭하세요.
                        </p>
                      </div>
                    );
                  }
                  
                  return proposalPoints.map((point, index) => {
                    // 각 point가 유효한 객체인지 확인
                    if (!point || typeof point !== 'object') {
                      console.warn('Invalid point object:', point);
                      return null;
                    }
                    
                    // 각 속성이 문자열인지 확인하고 변환
                    const title = point.title ? String(point.title) : '제안 포인트';
                    const solution = point.solution ? String(point.solution) : '솔루션';
                    const description = point.description ? String(point.description) : '설명이 없습니다.';
                    
                    return (
                      <div
                        key={point.id || index}
                        className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-foreground">
                            {title}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {solution}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {description}
                        </p>
                      </div>
                    );
                  }).filter(Boolean);
                })()}
              </div>
              
              <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                {fromHistory === 'true' ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => onNavigate && onNavigate("/ai-history")}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      히스토리로 돌아가기
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={handleReanalyze}
                    >
                      <RotateCcw className="w-4 h-4" />
                      새로 분석하기
                    </Button>
                  </>
                ) : fromCustomer === 'true' ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => onNavigate && onNavigate("/customers")}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      고객 목록으로 돌아가기
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={handleReanalyze}
                    >
                      <RotateCcw className="w-4 h-4" />
                      새로 분석하기
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={handleReanalyze}
                    >
                      <RotateCcw className="w-4 h-4" />
                      삭제하고 다시 분석하기
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleSaveToHistory}
                    >
                      히스토리에 저장
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
