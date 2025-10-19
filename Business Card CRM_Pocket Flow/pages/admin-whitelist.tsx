"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Shield, Plus, Trash2, AlertCircle, CheckCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "../utils/api";
import { LoadingState } from "../components/LoadingState";

interface AdminWhitelistPageProps {
  onNavigate?: (page: string) => void;
}

export default function AdminWhitelist({ onNavigate }: AdminWhitelistPageProps) {
  const isAdmin = true; // Mock admin for demo
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadWhitelist();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadWhitelist = async () => {
    // Mock access token for demo
    const accessToken = "mock-token";

    try {
      setLoading(true);
      const response = await adminApi.getWhitelist(accessToken);
      setWhitelist(response.whitelist || []);
    } catch (error: any) {
      console.error('Failed to load whitelist:', error);
      toast.error('화이트리스트를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const accessToken = "mock-token";
    if (!accessToken || !newEmail) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('올바른 이메일 형식을 입력하세요');
      return;
    }

    setAdding(true);

    try {
      const response = await adminApi.addToWhitelist(newEmail, accessToken);
      setWhitelist(response.whitelist);
      setNewEmail("");
      toast.success(`${newEmail}이 화이트리스트에 추가되었습니다`);
    } catch (error: any) {
      console.error('Failed to add to whitelist:', error);
      toast.error(error.message || '화이트리스트 추가에 실패했습니다');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    const accessToken = "mock-token";
    if (!accessToken) return;

    if (!confirm(`${email}을 화이트리스트에서 제거하시겠습니까?`)) {
      return;
    }

    try {
      const response = await adminApi.removeFromWhitelist(email, accessToken);
      setWhitelist(response.whitelist);
      toast.success(`${email}이 화이트리스트에서 제거되었습니다`);
    } catch (error: any) {
      console.error('Failed to remove from whitelist:', error);
      toast.error(error.message || '화이트리스트 제거에 실패했습니다');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-foreground">화이트리스트 관리</h1>
            <p className="text-muted-foreground">관리자 권한이 필요합니다</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            이 페이지는 관리자만 접근할 수 있습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return <LoadingState message="화이트리스트를 불러오는 중..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-foreground">화이트리스트 관리</h1>
          <p className="text-muted-foreground">
            회원가입이 허용된 이메일 주소를 관리합니다
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          화이트리스트에 추가된 이메일만 회원가입이 가능합니다. 
          새로운 사용자를 추가하려면 먼저 이메일을 화이트리스트에 등록하세요.
        </AlertDescription>
      </Alert>

      {/* Add Email Form */}
      <Card>
        <CardHeader>
          <CardTitle>새 이메일 추가</CardTitle>
          <CardDescription>
            화이트리스트에 추가할 이메일 주소를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddEmail} className="flex gap-3">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={adding}>
              <Plus className="w-4 h-4 mr-2" />
              {adding ? "추가 중..." : "추가"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Whitelist */}
      <Card>
        <CardHeader>
          <CardTitle>등록된 이메일 ({whitelist.length})</CardTitle>
          <CardDescription>
            현재 화이트리스트에 등록된 이메일 목록
          </CardDescription>
        </CardHeader>
        <CardContent>
          {whitelist.length === 0 ? (
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
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEmail(email)}
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
    </div>
  );
}
