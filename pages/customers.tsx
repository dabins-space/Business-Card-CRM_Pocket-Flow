"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { Search, Filter, Camera, CreditCard, Building2, Mail, Phone, Users, Trash2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { getVerticalLabel, VERTICAL_OPTIONS } from "../constants/data";
import { getImportanceColor } from "../utils/helpers";
import { cardsApi } from "../utils/api";
import { toast } from "sonner";
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

interface CustomersPageProps {
  onNavigate?: (page: string) => void;
}

export default function Customers({ onNavigate }: CustomersPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [importanceFilter, setImportanceFilter] = useState("all");
  // const [verticalFilter, setVerticalFilter] = useState("all");
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      console.log('Loading contacts from API...');
      
      const response = await fetch('/api/contacts');
      const result = await response.json();
      
      console.log('Contacts API response:', result);
      
      if (result.ok && result.contacts) {
        // Supabase 데이터를 UI에 맞게 변환
        const transformedCards = result.contacts.map((contact: any) => ({
          id: contact.id,
          name: contact.name,
          title: contact.title || '',
          department: contact.department || '',
          company: contact.company || '',
          importance: contact.importance,
          phone: contact.phone || '',
          email: contact.email || '',
          inquiryTypes: contact.inquiry_types || [],
          date: new Date(contact.created_at).toLocaleDateString('ko-KR'),
          image_path: contact.image_path,
          memo: contact.memo || ''
        }));
        
        console.log('Transformed cards:', transformedCards);
        setCards(transformedCards);
      } else {
        console.error('Failed to load contacts:', result.error);
        toast.error(result.error || '명함 목록을 불러오는데 실패했습니다');
        setCards([]);
      }
    } catch (error: any) {
      console.error('Failed to load cards:', error);
      toast.error('명함 목록을 불러오는데 실패했습니다');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesImportance =
      importanceFilter === "all" || card.importance?.toString() === importanceFilter;
    return matchesSearch && matchesImportance;
  });

  const handleDeleteCard = async (cardId: string, cardName: string) => {
    try {
      console.log('Deleting card:', cardId);
      
      const response = await fetch(`/api/contact/${cardId}/delete`, {
        method: 'DELETE',
      });

      const result = await response.json();
      console.log('Delete response:', result);

      if (result.ok) {
        // 삭제 성공 시 목록에서 해당 카드 제거
        setCards(prevCards => prevCards.filter(card => card.id !== cardId));
        toast.success(`${cardName}의 명함이 삭제되었습니다`);
      } else {
        console.error('Delete failed:', result.error);
        toast.error(result.error || "삭제에 실패했습니다");
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error("삭제 중 오류가 발생했습니다");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-foreground">고객 목록</h1>
            <p className="text-muted-foreground">
              총 {filteredCards.length}개의 명함
            </p>
          </div>
        </div>
        <Button onClick={() => onNavigate && onNavigate("/upload")}>
          <Camera className="w-4 h-4" />
          명함 등록
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="이름 또는 회사명 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Vertical filter temporarily disabled */}
            <div className="flex items-center justify-center p-2 border border-border rounded-md bg-muted/50">
              <span className="text-muted-foreground text-sm">필터 준비 중</span>
            </div>

            <Select value={importanceFilter} onValueChange={setImportanceFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="중요도" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 중요도</SelectItem>
                <SelectItem value="5">중요도 5</SelectItem>
                <SelectItem value="4">중요도 4</SelectItem>
                <SelectItem value="3">중요도 3</SelectItem>
                <SelectItem value="2">중요도 2</SelectItem>
                <SelectItem value="1">중요도 1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards Grid */}
      {loading ? (
        <LoadingState message="명함 목록을 불러오는 중..." />
      ) : filteredCards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="명함이 없습니다"
          description="검색 조건을 변경하거나 새로운 명함을 등록하세요"
          actionLabel="명함 등록"
          onAction={() => onNavigate && onNavigate("/upload")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <Card
              key={card.id}
              className="overflow-hidden hover:border-primary/50 transition-colors"
            >
              <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                <div 
                  className="w-full h-full cursor-pointer"
                  onClick={() => onNavigate && onNavigate(`/customer-detail?id=${card.id}`)}
                >
                  {card.image_path ? (
                    <img
                      src={`https://qmyyyxkpemdjuwtimwsv.supabase.co/storage/v1/object/public/business-cards/${card.image_path}`}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 이미지 로드 실패 시 기본 이미지 표시
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center bg-muted ${card.image_path ? 'hidden' : ''}`}>
                    <CreditCard className="w-12 h-12 text-muted-foreground" />
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded ${getImportanceColor(
                      card.importance
                    )}`}
                  >
                    {card.importance}
                  </span>
                </div>
                <div className="absolute top-2 left-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>명함을 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {card.name}의 명함을 삭제합니다. 이 작업은 취소할 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteCard(card.id, card.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <h3 className="text-foreground">{card.name}</h3>
                  <p className="text-muted-foreground">
                    {card.position}
                    {card.department && ` · ${card.department}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground flex-1 min-w-0">
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{card.company}</span>
                  </div>
                  {/* Vertical badge temporarily disabled */}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{card.email}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{card.phone}</span>
                </div>

                <div className="flex flex-wrap gap-1 pt-2">
                  {card.inquiryTypes.map((type: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {type}
                    </Badge>
                  ))}
                </div>

                <div className="text-muted-foreground pt-2 border-t border-border">
                  {card.date}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
