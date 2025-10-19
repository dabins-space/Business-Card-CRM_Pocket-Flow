"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface InquiryType {
  id: string;
  label: string;
  value: string;
  enabled: boolean;
  order: number;
}

export default function AdminInquiryTypes() {
  const [inquiryTypes, setInquiryTypes] = useState<InquiryType[]>([
    { id: "1", label: "제안", value: "proposal", enabled: true, order: 1 },
    { id: "2", label: "상담", value: "consult", enabled: true, order: 2 },
    { id: "3", label: "문의", value: "inquiry", enabled: true, order: 3 },
    { id: "4", label: "파트너십", value: "partnership", enabled: true, order: 4 },
    { id: "5", label: "지원", value: "support", enabled: true, order: 5 },
    { id: "6", label: "미팅", value: "meeting", enabled: false, order: 6 },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<InquiryType | null>(null);
  const [formData, setFormData] = useState({ label: "", value: "" });

  const handleAdd = () => {
    if (!formData.label.trim() || !formData.value.trim()) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }

    const newType: InquiryType = {
      id: Date.now().toString(),
      label: formData.label,
      value: formData.value,
      enabled: true,
      order: inquiryTypes.length + 1,
    };

    setInquiryTypes([...inquiryTypes, newType]);
    setFormData({ label: "", value: "" });
    setIsAddDialogOpen(false);
    toast.success("문의 유형이 추가되었습니다");
  };

  const handleEdit = (type: InquiryType) => {
    setEditingType(type);
    setFormData({ label: type.label, value: type.value });
  };

  const handleUpdate = () => {
    if (!editingType) return;

    setInquiryTypes(
      inquiryTypes.map((type) =>
        type.id === editingType.id
          ? { ...type, label: formData.label, value: formData.value }
          : type
      )
    );

    setEditingType(null);
    setFormData({ label: "", value: "" });
    toast.success("문의 유형이 수정되었습니다");
  };

  const handleDelete = (id: string) => {
    setInquiryTypes(inquiryTypes.filter((type) => type.id !== id));
    toast.success("문의 유형이 삭제되었습니다");
  };

  const handleToggle = (id: string) => {
    setInquiryTypes(
      inquiryTypes.map((type) =>
        type.id === id ? { ...type, enabled: !type.enabled } : type
      )
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-2">문의 유형 관리</h1>
          <p className="text-muted-foreground">
            명함 및 대화 기록에 사용되는 문의 유형을 관리합니다
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              새 유형 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 문의 유형 추가</DialogTitle>
              <DialogDescription>
                새로운 문의 유형의 이름과 값을 입력하세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">표시 이름</Label>
                <Input
                  id="label"
                  placeholder="예: 제안"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">값 (영문)</Label>
                <Input
                  id="value"
                  placeholder="예: proposal"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleAdd}>추가</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>문의 유형 목록</CardTitle>
          <CardDescription>
            총 {inquiryTypes.length}개 · 활성 {inquiryTypes.filter((t) => t.enabled).length}개
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>표시 이름</TableHead>
                  <TableHead>값</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiryTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    </TableCell>
                    <TableCell className="text-foreground">
                      {type.label}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {type.value}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={type.enabled}
                          onCheckedChange={() => handleToggle(type.id)}
                        />
                        <Badge variant={type.enabled ? "default" : "secondary"}>
                          {type.enabled ? "활성" : "비활성"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(type.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {inquiryTypes.map((type) => (
              <div
                key={type.id}
                className="p-4 rounded-lg border border-border space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-foreground">{type.label}</p>
                    <p className="text-muted-foreground">{type.value}</p>
                  </div>
                  <Badge variant={type.enabled ? "default" : "secondary"}>
                    {type.enabled ? "활성" : "비활성"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <Switch
                    checked={type.enabled}
                    onCheckedChange={() => handleToggle(type.id)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(type)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(type.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingType} onOpenChange={() => setEditingType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문의 유형 수정</DialogTitle>
            <DialogDescription>
              문의 유형의 정보를 수정하세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-label">표시 이름</Label>
              <Input
                id="edit-label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">값 (영문)</Label>
              <Input
                id="edit-value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingType(null)}>
              취소
            </Button>
            <Button onClick={handleUpdate}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
