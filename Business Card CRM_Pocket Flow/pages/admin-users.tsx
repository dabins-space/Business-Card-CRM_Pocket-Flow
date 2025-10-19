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
import { Plus, Edit, Trash2, UserPlus, Shield, User } from "lucide-react";
import { toast } from "sonner";

interface WhitelistUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  allowed: boolean;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<WhitelistUser[]>([
    {
      id: "1",
      email: "admin@company.com",
      name: "관리자",
      role: "admin",
      allowed: true,
      createdAt: "2025-10-01",
    },
    {
      id: "2",
      email: "user1@company.com",
      name: "김철수",
      role: "user",
      allowed: true,
      createdAt: "2025-10-05",
    },
    {
      id: "3",
      email: "user2@company.com",
      name: "이영희",
      role: "user",
      allowed: true,
      createdAt: "2025-10-10",
    },
    {
      id: "4",
      email: "pending@company.com",
      name: "박민수",
      role: "user",
      allowed: false,
      createdAt: "2025-10-15",
    },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<WhitelistUser | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "user" as "admin" | "user",
    allowed: true,
  });

  const handleAdd = () => {
    if (!formData.email.trim() || !formData.name.trim()) {
      toast.error("이메일과 이름을 입력해주세요");
      return;
    }

    // Check if email already exists
    if (users.some((u) => u.email === formData.email)) {
      toast.error("이미 등록된 이메일입니다");
      return;
    }

    const newUser: WhitelistUser = {
      id: Date.now().toString(),
      email: formData.email,
      name: formData.name,
      role: formData.role,
      allowed: formData.allowed,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setUsers([...users, newUser]);
    setFormData({ email: "", name: "", role: "user", allowed: true });
    setIsAddDialogOpen(false);
    toast.success("사용자가 추가되었습니다");
  };

  const handleEdit = (user: WhitelistUser) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      allowed: user.allowed,
    });
  };

  const handleUpdate = () => {
    if (!editingUser) return;

    setUsers(
      users.map((user) =>
        user.id === editingUser.id
          ? {
              ...user,
              email: formData.email,
              name: formData.name,
              role: formData.role,
              allowed: formData.allowed,
            }
          : user
      )
    );

    setEditingUser(null);
    setFormData({ email: "", name: "", role: "user", allowed: true });
    toast.success("사용자 정보가 수정되었습니다");
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter((user) => user.id !== id));
    toast.success("사용자가 삭제되었습니다");
  };

  const handleToggleAllowed = (id: string) => {
    setUsers(
      users.map((user) =>
        user.id === id ? { ...user, allowed: !user.allowed } : user
      )
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-2">사전 등록 사용자 관리</h1>
          <p className="text-muted-foreground">
            로그인 가능한 사용자를 관리합니다 (화이트리스트)
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              사용자 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 사용자 추가</DialogTitle>
              <DialogDescription>
                화이트리스트에 추가할 사용자 정보를 입력하세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  이메일 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">역할</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "user") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">일반 사용자</SelectItem>
                    <SelectItem value="admin">관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label>로그인 허용</Label>
                  <p className="text-muted-foreground">
                    비활성화 시 로그인이 차단됩니다
                  </p>
                </div>
                <Switch
                  checked={formData.allowed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allowed: checked })
                  }
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">전체 사용자</p>
                <p className="text-foreground mt-1">{users.length}명</p>
              </div>
              <User className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">활성 사용자</p>
                <p className="text-foreground mt-1">
                  {users.filter((u) => u.allowed).length}명
                </p>
              </div>
              <Shield className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">관리자</p>
                <p className="text-foreground mt-1">
                  {users.filter((u) => u.role === "admin").length}명
                </p>
              </div>
              <Shield className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <CardDescription>
            등록된 화이트리스트 사용자 · 활성 {users.filter((u) => u.allowed).length} / 전체 {users.length}명
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이메일</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-foreground">{user.name}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? "관리자" : "사용자"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.allowed}
                          onCheckedChange={() => handleToggleAllowed(user.id)}
                        />
                        <Badge variant={user.allowed ? "default" : "secondary"}>
                          {user.allowed ? "활성" : "비활성"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.createdAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(user.id)}
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
            {users.map((user) => (
              <div
                key={user.id}
                className="p-4 rounded-lg border border-border space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate">{user.name}</p>
                    <p className="text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? "관리자" : "사용자"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={user.allowed}
                      onCheckedChange={() => handleToggleAllowed(user.id)}
                    />
                    <Badge variant={user.allowed ? "default" : "secondary"}>
                      {user.allowed ? "활성" : "비활성"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-muted-foreground pt-2 border-t border-border">
                  등록일: {user.createdAt}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 정보 수정</DialogTitle>
            <DialogDescription>
              사용자의 정보를 수정하세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">이메일</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">이름</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">역할</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "user") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">일반 사용자</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label>로그인 허용</Label>
                <p className="text-muted-foreground">
                  비활성화 시 로그인이 차단됩니다
                </p>
              </div>
              <Switch
                checked={formData.allowed}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, allowed: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              취소
            </Button>
            <Button onClick={handleUpdate}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
