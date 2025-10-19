"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Building2,
  Mail,
  Phone,
  Edit,
  Trash2,
  Sparkles,
  Calendar,
  MessageSquare,
  Plus,
  Lightbulb,
  Target,
  FileText,
  CreditCard,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getImportanceColor, getPriorityColor } from "../utils/helpers";
import { getVerticalLabel } from "../constants/data";

interface CustomerDetailPageProps {
  onNavigate?: (page: string) => void;
  contactId?: string;
}

export default function CustomerDetail({ onNavigate, contactId }: CustomerDetailPageProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [newMemo, setNewMemo] = useState("");
  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContactData();
  }, [contactId]);

  const loadContactData = async () => {
    try {
      setLoading(true);
      
      if (!contactId) {
        setError('연락처 ID가 없습니다');
        return;
      }

      console.log('Loading contact data for ID:', contactId);
      
      const response = await fetch(`/api/contact/${contactId}`);
      const result = await response.json();
      
      console.log('Contact API response:', result);
      
      if (result.ok && result.contact) {
        const contact = result.contact;
        setCardData({
          id: contact.id,
          name: contact.name,
          position: contact.title || '',
          department: contact.department || '',
          company: contact.company || '',
          email: contact.email || '',
          phone: contact.phone || '',
          importance: contact.importance,
          inquiryTypes: contact.inquiry_types || [],
          memo: contact.memo || '',
          image_path: contact.image_path,
          date: new Date(contact.created_at).toLocaleDateString('ko-KR'),
        });
      } else {
        setError(result.error || '연락처를 불러오는데 실패했습니다');
      }
    } catch (error: any) {
      console.error('Failed to load contact:', error);
      setError('연락처를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const companyInfo = {
    name: "테크코퍼레이션",
    vertical: "it",
    industry: "소프트웨어 개발",
    employees: "50-100명",
    founded: "2015년",
    website: "www.techcorp.com",
  };

  const aiInsight = {
    overview:
      "테크코퍼레이션은 엔터프라이즈급 B2B SaaS 솔루션을 전문으로 하는 중견 소프트웨어 개발 회사입니다.",
    opportunities: [
      {
        id: 1,
        title: "API 통합 파트너십",
        description: "당사의 결제 솔루션과 협업 플랫폼 통합 가능성",
        priority: "high",
      },
      {
        id: 2,
        title: "공동 마케팅 캠페인",
        description: "B2B 시장 공동 마케팅 기회",
        priority: "medium",
      },
    ],
    lastAnalyzed: "2025-10-17",
  };

  const history = [
    {
      id: 1,
      date: "2025-10-17",
      type: "memo",
      title: "프로젝트 협업 제안",
      content: "클라우드 마이그레이션 프로젝트 협업 논의. 긍정적 반응.",
    },
    {
      id: 2,
      date: "2025-10-10",
      type: "ai-insight",
      title: "AI 인사이트 생성",
      content: "회사 분석 및 비즈니스 기회 도출 완료",
    },
    {
      id: 3,
      date: "2025-10-05",
      type: "memo",
      title: "기술 스택 논의",
      content: "React, Node.js 기반 기술 스택 공유 및 협업 가능성 타진",
    },
  ];

  const handleDelete = () => {
    toast.success("명함이 삭제되었습니다");
    if (onNavigate) {
      onNavigate("/customers");
    }
  };

  const handleAddMemo = () => {
    if (!newMemo.trim()) {
      toast.error("메모 내용을 입력해주세요");
      return;
    }
    toast.success("메모가 추가되었습니다");
    setNewMemo("");
  };

  const handleEdit = () => {
    setEditData({
      name: cardData.name,
      title: cardData.position,
      department: cardData.department,
      company: cardData.company,
      email: cardData.email,
      phone: cardData.phone,
      importance: cardData.importance,
      inquiry_types: cardData.inquiryTypes,
      memo: cardData.memo,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!contactId) return;

    try {
      setSaving(true);
      console.log('Saving contact data:', editData);

      const response = await fetch(`/api/contact/${contactId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData)
      });

      const result = await response.json();
      console.log('Update response:', result);

      if (result.ok && result.contact) {
        // 업데이트된 데이터로 상태 업데이트
        const updatedContact = result.contact;
        setCardData({
          id: updatedContact.id,
          name: updatedContact.name,
          position: updatedContact.title || '',
          department: updatedContact.department || '',
          company: updatedContact.company || '',
          email: updatedContact.email || '',
          phone: updatedContact.phone || '',
          importance: updatedContact.importance,
          inquiryTypes: updatedContact.inquiry_types || [],
          memo: updatedContact.memo || '',
          image_path: updatedContact.image_path,
          date: new Date(updatedContact.updated_at).toLocaleDateString('ko-KR'),
        });
        
        setIsEditing(false);
        toast.success("연락처 정보가 수정되었습니다");
      } else {
        console.error('Update failed:', result.error);
        toast.error(result.error || "수정에 실패했습니다");
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error("수정 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
    toast.info("수정이 취소되었습니다");
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">연락처 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || '연락처를 찾을 수 없습니다'}</p>
            <Button onClick={() => onNavigate && onNavigate("/customers")}>
              고객 목록으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-foreground">{cardData.name}</h1>
            <span
              className={`px-2 py-1 rounded ${getImportanceColor(
                cardData.importance
              )}`}
            >
              {cardData.importance}
            </span>
            {cardData.vertical && (
              <Badge variant="outline" className="border-primary/30 text-primary">
                {getVerticalLabel(cardData.vertical)}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {cardData.position} · {cardData.department} · {cardData.company}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isEditing ? (
            <Button variant="outline" className="gap-2" onClick={handleEdit}>
              <Edit className="w-4 h-4" />
              수정
            </Button>
          ) : (
            <>
              <Button 
                className="gap-2" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    저장
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="w-4 h-4" />
                취소
              </Button>
            </>
          )}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => onNavigate && onNavigate("/ai-insights")}
          >
            <Sparkles className="w-4 h-4" />
            AI 분석
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>명함을 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 취소할 수 없습니다. 명함과 관련된 모든 정보가 삭제됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Image */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>명함 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-[16/10] rounded-lg overflow-hidden border border-border">
              {cardData.image_path ? (
                <img
                  src={`https://qmyyyxkpemdjuwtimwsv.supabase.co/storage/v1/object/public/business-cards/${cardData.image_path}`}
                  alt={cardData.name}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  onError={(e) => {
                    // 이미지 로드 실패 시 기본 이미지 표시
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full flex items-center justify-center bg-muted ${cardData.image_path ? 'hidden' : ''}`}>
                <CreditCard className="w-16 h-16 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Tabs */}
        <Card className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="info" className="gap-2">
                  <FileText className="w-4 h-4" />
                  기본정보
                </TabsTrigger>
                <TabsTrigger value="ai-insight" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI 인사이트
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  히스토리
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* 기본정보 탭 */}
              <TabsContent value="info" className="space-y-4 mt-0">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">이름</Label>
                        <Input
                          id="edit-name"
                          value={editData.name || ''}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-title">직책</Label>
                        <Input
                          id="edit-title"
                          value={editData.title || ''}
                          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-department">부서</Label>
                        <Input
                          id="edit-department"
                          value={editData.department || ''}
                          onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-company">회사</Label>
                        <Input
                          id="edit-company"
                          value={editData.company || ''}
                          onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-email">이메일</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">전화번호</Label>
                      <Input
                        id="edit-phone"
                        type="tel"
                        value={editData.phone || ''}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-importance">중요도</Label>
                      <Input
                        id="edit-importance"
                        type="number"
                        min="1"
                        max="5"
                        value={editData.importance || 3}
                        onChange={(e) => setEditData({ ...editData, importance: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-memo">메모</Label>
                      <Textarea
                        id="edit-memo"
                        rows={4}
                        value={editData.memo || ''}
                        onChange={(e) => setEditData({ ...editData, memo: e.target.value })}
                        placeholder="메모를 입력하세요"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">이메일</p>
                        <p className="text-foreground">{cardData.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">전화번호</p>
                        <p className="text-foreground">{cardData.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">회사</p>
                        <p className="text-foreground">{cardData.company}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">등록일</p>
                        <p className="text-foreground">{cardData.date}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <p className="text-muted-foreground mb-2">문의 유형</p>
                  <div className="flex flex-wrap gap-2">
                    {cardData.inquiryTypes.map((type: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="text-foreground mb-3">회사 정보</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {companyInfo.vertical && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground mb-1">버티컬</p>
                        <p className="text-foreground">{getVerticalLabel(companyInfo.vertical)}</p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground mb-1">산업</p>
                      <p className="text-foreground">{companyInfo.industry}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground mb-1">직원 수</p>
                      <p className="text-foreground">{companyInfo.employees}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground mb-1">설립연도</p>
                      <p className="text-foreground">{companyInfo.founded}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground mb-1">웹사이트</p>
                      <p className="text-foreground">{companyInfo.website}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* AI 인사이트 탭 */}
              <TabsContent value="ai-insight" className="space-y-4 mt-0">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-muted-foreground">
                    최근 분석: {aiInsight.lastAnalyzed}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate && onNavigate("/ai-insights")}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    재분석
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h4 className="text-foreground mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    회사 개요
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {aiInsight.overview}
                  </p>
                </div>

                <div>
                  <h4 className="text-foreground mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    비즈니스 기회
                  </h4>
                  <div className="space-y-3">
                    {aiInsight.opportunities.map((opportunity) => (
                      <div
                        key={opportunity.id}
                        className="p-4 rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-foreground">{opportunity.title}</h3>
                          <Badge className={getPriorityColor(opportunity.priority)}>
                            {opportunity.priority === "high" ? "높음" : "중간"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{opportunity.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => onNavigate && onNavigate("/ai-insights")}
                >
                  <Target className="w-4 h-4" />
                  전체 인사이트 보기
                </Button>
              </TabsContent>

              {/* 히스토리 탭 */}
              <TabsContent value="history" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="new-memo">새 메모 추가</Label>
                  <Textarea
                    id="new-memo"
                    rows={3}
                    placeholder="대화 내용, 미팅 메모 등을 기록하세요..."
                    value={newMemo}
                    onChange={(e) => setNewMemo(e.target.value)}
                  />
                  <Button onClick={handleAddMemo} className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    메모 추가
                  </Button>
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="text-foreground mb-3">타임라인</h4>
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {item.type === "ai-insight" ? (
                              <Sparkles className="w-4 h-4 text-primary" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="text-foreground">{item.title}</span>
                          </div>
                          <span className="text-muted-foreground">{item.date}</span>
                        </div>
                        <p className="text-muted-foreground pl-6">{item.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
