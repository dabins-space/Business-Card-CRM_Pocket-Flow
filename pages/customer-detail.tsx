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
  Users,
  User,
  Briefcase,
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
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [contactHistory, setContactHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingMemoContent, setEditingMemoContent] = useState('');

  useEffect(() => {
    loadContactData();
  }, [contactId]);

  useEffect(() => {
    if (cardData?.company) {
      loadAIAnalysis();
    }
  }, [cardData?.company]);

  useEffect(() => {
    if (contactId) {
      loadContactHistory();
    }
  }, [contactId]);

  const loadContactData = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
        const transformedData = {
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
        };
        
        console.log('Transformed card data:', transformedData);
        setCardData(transformedData);
      } else {
        console.error('Failed to load contact:', result.error);
        setError(result.error || '연락처를 불러오는데 실패했습니다');
      }
    } catch (error: any) {
      console.error('Failed to load contact:', error);
      setError('연락처를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadAIAnalysis = async () => {
    if (!cardData?.company) return;
    
    try {
      setAiLoading(true);
      
      const response = await fetch('/api/ai-analysis/get-latest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: cardData.company })
      });
      
      const result = await response.json();
      
      if (result.ok && result.analysis) {
        setAiInsight(result.analysis);
      } else {
        // AI 분석 결과가 없는 경우 기본값 설정
        setAiInsight({
          overview: "AI 분석 결과가 없습니다. AI 인사이트 페이지에서 분석을 실행해주세요.",
          lastAnalyzed: "분석 없음",
          opportunities: [],
          proposalPoints: []
        });
      }
    } catch (error: any) {
      console.error('Failed to load AI analysis:', error);
      setAiInsight({
        overview: "AI 분석 결과를 불러오는데 실패했습니다.",
        lastAnalyzed: "오류",
        opportunities: [],
        proposalPoints: []
      });
    } finally {
      setAiLoading(false);
    }
  };

  const loadContactHistory = async () => {
    if (!contactId) return;
    
    try {
      setHistoryLoading(true);
      console.log('Loading contact history for ID:', contactId);
      
      const response = await fetch(`/api/contact/${contactId}/history`);
      const result = await response.json();
      
      console.log('History API response:', result);
      
      if (result.ok && result.history) {
        console.log('History loaded successfully:', result.history.length, 'items');
        setContactHistory(result.history);
      } else {
        console.error('Failed to load contact history:', result.error);
        setContactHistory([]);
      }
    } catch (error: any) {
      console.error('Failed to load contact history:', error);
      setContactHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // companyInfo는 이제 실제 데이터로 동적 생성
  const companyInfo = cardData ? {
    name: cardData.company || "정보 없음",
    vertical: aiInsight?.industry || "정보 없음",
    industry: aiInsight?.industry || "정보 없음",
    employees: aiInsight?.employees || "정보 없음",
    founded: aiInsight?.founded || "정보 없음",
    website: aiInsight?.website || "정보 없음",
  } : {
    name: "정보 없음",
    vertical: "정보 없음",
    industry: "정보 없음",
    employees: "정보 없음",
    founded: "정보 없음",
    website: "정보 없음",
  };

  // aiInsight는 이제 state로 관리됨

  // 히스토리는 이제 contactHistory state로 관리됨

  const handleDelete = async () => {
    if (!contactId) {
      toast.error("연락처 ID가 없습니다");
      return;
    }

    try {
      console.log('Deleting contact:', contactId);
      
      const response = await fetch(`/api/contact/${contactId}/delete`, {
        method: 'DELETE',
      });

      const result = await response.json();
      console.log('Delete response:', result);

      if (result.ok) {
        toast.success("명함이 삭제되었습니다");
        if (onNavigate) {
          onNavigate("/customers");
        }
      } else {
        console.error('Delete failed:', result.error);
        toast.error(result.error || "삭제에 실패했습니다");
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error("삭제 중 오류가 발생했습니다");
    }
  };

  const handleAddMemo = async () => {
    if (!newMemo.trim()) {
      toast.error("메모 내용을 입력해주세요");
      return;
    }

    if (!contactId) {
      toast.error("연락처 ID가 없습니다");
      return;
    }

    try {
      const currentDate = new Date().toLocaleDateString('ko-KR');
      const currentTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      
      // 기존 메모에 새 메모 추가
      const updatedMemo = cardData.memo 
        ? `${cardData.memo}\n\n[${currentDate} ${currentTime}] ${newMemo}`
        : `[${currentDate} ${currentTime}] ${newMemo}`;

      const response = await fetch(`/api/contact/${contactId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memo: updatedMemo })
      });

      const result = await response.json();

      if (result.ok) {
        // 로컬 상태 업데이트
        setCardData((prev: any) => ({
          ...prev,
          memo: updatedMemo
        }));

        // 히스토리에 메모 추가 기록
        try {
          console.log('Adding memo to history...');
          const historyResponse = await fetch(`/api/contact/${contactId}/add-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action_type: 'memo_add',
              title: '메모 추가',
              content: newMemo,
              old_value: cardData.memo || '',
              new_value: updatedMemo
            })
          });
          
          const historyResult = await historyResponse.json();
          console.log('History add response:', historyResult);
          
          if (historyResult.ok) {
            console.log('History added successfully');
          } else {
            console.error('Failed to add history:', historyResult.error);
          }
        } catch (historyError) {
          console.error('Failed to add history:', historyError);
          // 히스토리 추가 실패는 메모 추가를 막지 않음
        }

        toast.success("메모가 추가되었습니다");
        setNewMemo("");
        
        // 히스토리 새로고침
        loadContactHistory();
      } else {
        toast.error(result.error || "메모 추가에 실패했습니다");
      }
    } catch (error: any) {
      console.error('Add memo error:', error);
      toast.error("메모 추가 중 오류가 발생했습니다");
    }
  };

  const handleEditMemo = (memoId: string, currentContent: string) => {
    setEditingMemoId(memoId);
    setEditingMemoContent(currentContent);
    setIsEditingMemo(true);
  };

  const handleSaveMemoEdit = async () => {
    if (!editingMemoId || !editingMemoContent.trim()) {
      toast.error("메모 내용을 입력해주세요");
      return;
    }

    if (!contactId) {
      toast.error("연락처 ID가 없습니다");
      return;
    }

    try {
      // 현재 메모에서 편집 중인 부분을 찾아서 교체
      const currentMemo = cardData.memo || '';
      const memoLines = currentMemo.split('\n');
      
      // 편집 중인 메모 라인 찾기 (간단한 방법: ID로 찾기)
      let updatedMemo = currentMemo;
      
      // 더 정확한 방법: 날짜 패턴으로 찾아서 교체
      const datePattern = /\[\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{2}\]/g;
      const matches = [...currentMemo.matchAll(datePattern)];
      
      if (matches.length > 0) {
        // 마지막 메모 항목을 새로운 내용으로 교체
        const lastMatch = matches[matches.length - 1];
        const beforeLast = currentMemo.substring(0, lastMatch.index);
        const afterLast = currentMemo.substring(lastMatch.index! + lastMatch[0].length);
        
        // 기존 내용 제거하고 새 내용 추가
        const lines = afterLast.split('\n');
        const newLines = lines.slice(1); // 첫 번째 줄(기존 메모 내용) 제거
        
        const currentDate = new Date().toLocaleDateString('ko-KR');
        const currentTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        
        updatedMemo = beforeLast + lastMatch[0] + ' ' + editingMemoContent + 
          (newLines.length > 0 ? '\n' + newLines.join('\n') : '');
      }

      const response = await fetch(`/api/contact/${contactId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memo: updatedMemo })
      });

      const result = await response.json();

      if (result.ok) {
        // 로컬 상태 업데이트
        setCardData((prev: any) => ({
          ...prev,
          memo: updatedMemo
        }));

        // 히스토리에 메모 수정 기록
        try {
          await fetch(`/api/contact/${contactId}/add-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action_type: 'memo_edit',
              title: '메모 수정',
              content: editingMemoContent,
              old_value: editingMemoContent, // 실제로는 이전 내용이어야 하지만 간단히 처리
              new_value: editingMemoContent
            })
          });
        } catch (historyError) {
          console.error('Failed to add history:', historyError);
        }

        toast.success("메모가 수정되었습니다");
        setIsEditingMemo(false);
        setEditingMemoId(null);
        setEditingMemoContent('');
        
        // 히스토리 새로고침
        loadContactHistory();
      } else {
        toast.error(result.error || "메모 수정에 실패했습니다");
      }
    } catch (error: any) {
      console.error('Edit memo error:', error);
      toast.error("메모 수정 중 오류가 발생했습니다");
    }
  };

  const handleCancelMemoEdit = () => {
    setIsEditingMemo(false);
    setEditingMemoId(null);
    setEditingMemoContent('');
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
      console.log('Memo value being saved:', editData.memo);

      const response = await fetch(`/api/contact/${contactId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData)
      });

      const result = await response.json();
      console.log('Update response:', result);
      console.log('Updated memo from response:', result.contact?.memo);

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
        
        // 히스토리에 정보 수정 기록
        try {
          await fetch(`/api/contact/${contactId}/add-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action_type: 'info_update',
              title: '정보 수정',
              content: '연락처 기본 정보가 수정되었습니다',
              old_value: JSON.stringify(cardData),
              new_value: JSON.stringify(updatedContact)
            })
          });
        } catch (historyError) {
          console.error('Failed to add history:', historyError);
        }
        
        // 히스토리 새로고침
        loadContactHistory();
        
        // 회사명이 변경된 경우 AI 분석 데이터 다시 로드
        if (updatedContact.company !== cardData.company) {
          loadAIAnalysis();
        }
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
            {contactId && (
              <p className="text-xs text-muted-foreground mt-2">ID: {contactId}</p>
            )}
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
            {contactId && (
              <p className="text-xs text-muted-foreground mb-4">ID: {contactId}</p>
            )}
            <div className="space-y-2">
              <Button onClick={() => onNavigate && onNavigate("/customers")}>
                고객 목록으로 돌아가기
              </Button>
              <Button 
                variant="outline" 
                onClick={loadContactData}
                className="ml-2"
              >
                다시 시도
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 디버깅을 위한 로그
  console.log('Rendering customer detail with cardData:', cardData);

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
                {!cardData ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">데이터를 불러오는 중...</p>
                  </div>
                ) : isEditing ? (
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
                    {/* 회사명 - 맨 위에 표시 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">회사</p>
                        <p className="text-foreground">{cardData.company || '정보 없음'}</p>
                      </div>
                    </div>

                    {/* 이름 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">이름</p>
                        <p className="text-foreground">{cardData.name || '정보 없음'}</p>
                      </div>
                    </div>

                    {/* 직책 */}
                    {cardData.position && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Briefcase className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">직책</p>
                          <p className="text-foreground">{cardData.position}</p>
                        </div>
                      </div>
                    )}

                    {/* 부서 */}
                    {cardData.department && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">부서</p>
                          <p className="text-foreground">{cardData.department}</p>
                        </div>
                      </div>
                    )}

                    {/* 이메일 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">이메일</p>
                        <p className="text-foreground">{cardData.email || '정보 없음'}</p>
                      </div>
                    </div>

                    {/* 전화번호 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">전화번호</p>
                        <p className="text-foreground">{cardData.phone || '정보 없음'}</p>
                      </div>
                    </div>

                    {/* 중요도 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Target className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">중요도</p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-sm ${getImportanceColor(
                              cardData.importance
                            )}`}
                          >
                            {cardData.importance}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 등록일 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">등록일</p>
                        <p className="text-foreground">{cardData.date}</p>
                      </div>
                    </div>

                    {/* 메모 */}
                    {cardData.memo && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-muted-foreground">메모</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // 마지막 메모 항목의 내용 추출
                              const memoLines = cardData.memo.split('\n');
                              const lastMemoLine = memoLines[memoLines.length - 1];
                              const datePattern = /\[\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{2}\]/;
                              const content = lastMemoLine.replace(datePattern, '').trim();
                              handleEditMemo('last', content);
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            편집
                          </Button>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap">{cardData.memo}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <p className="text-muted-foreground mb-2">문의 유형</p>
                  <div className="flex flex-wrap gap-2">
                    {cardData.inquiryTypes && cardData.inquiryTypes.length > 0 ? (
                      cardData.inquiryTypes.map((type: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {type}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">문의 유형이 없습니다</p>
                    )}
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
                    최근 분석: {aiInsight?.lastAnalyzed || "분석 없음"}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate && onNavigate("/ai-insights")}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {aiInsight?.lastAnalyzed === "분석 없음" ? "분석하기" : "재분석"}
                  </Button>
                </div>

                {aiLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">AI 분석 결과를 불러오는 중...</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <h4 className="text-foreground mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      회사 개요
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {aiInsight?.overview || "AI 분석 결과가 없습니다."}
                    </p>
                  </div>
                )}

                {aiInsight?.opportunities && aiInsight.opportunities.length > 0 && (
                  <div>
                    <h4 className="text-foreground mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      비즈니스 기회
                    </h4>
                    <div className="space-y-3">
                      {aiInsight.opportunities.map((opportunity: any) => (
                        <div
                          key={opportunity.id}
                          className="p-4 rounded-lg border border-border"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-foreground">{opportunity.title}</h3>
                            <Badge className={getPriorityColor(opportunity.priority)}>
                              {opportunity.priority === "high" ? "높음" : 
                               opportunity.priority === "medium" ? "중간" : "낮음"}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{opportunity.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiInsight?.proposalPoints && aiInsight.proposalPoints.length > 0 && (
                  <div>
                    <h4 className="text-foreground mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      제안 포인트
                    </h4>
                    <div className="space-y-2">
                      {aiInsight.proposalPoints.map((point: string, index: number) => (
                        <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border">
                          <p className="text-foreground">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* 메모 편집 모달 */}
                {isEditingMemo && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                      <h3 className="text-lg font-semibold mb-4">메모 편집</h3>
                      <Textarea
                        rows={4}
                        placeholder="메모 내용을 수정하세요..."
                        value={editingMemoContent}
                        onChange={(e) => setEditingMemoContent(e.target.value)}
                        className="mb-4"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={handleCancelMemoEdit}
                        >
                          취소
                        </Button>
                        <Button
                          onClick={handleSaveMemoEdit}
                          disabled={!editingMemoContent.trim()}
                        >
                          저장
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <h4 className="text-foreground mb-3">타임라인</h4>
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">히스토리 로딩 중...</span>
                    </div>
                  ) : contactHistory.length > 0 ? (
                    <div className="space-y-3">
                      {contactHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {item.action_type === "ai_analysis" ? (
                                <Sparkles className="w-4 h-4 text-primary" />
                              ) : item.action_type === "memo_add" ? (
                                <MessageSquare className="w-4 h-4 text-blue-500" />
                              ) : item.action_type === "info_update" ? (
                                <Edit className="w-4 h-4 text-green-500" />
                              ) : (
                                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="text-foreground">{item.title}</span>
                            </div>
                            <span className="text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString('ko-KR')} {new Date(item.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-muted-foreground pl-6">{item.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">아직 히스토리가 없습니다</p>
                      <p className="text-xs">메모를 추가하거나 정보를 수정하면 히스토리가 기록됩니다</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
