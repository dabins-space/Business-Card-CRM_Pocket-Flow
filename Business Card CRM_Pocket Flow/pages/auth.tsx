"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Building2, AlertCircle, CheckCircle } from "lucide-react";

// AuthContext를 dynamic으로 감싸기
const AuthProvider = dynamic(() => import("../contexts/AuthContext").then(mod => ({ default: mod.AuthProvider })), {
  ssr: false,
});

const useAuth = dynamic(() => import("../contexts/AuthContext").then(mod => ({ default: mod.useAuth })), {
  ssr: false,
});

interface AuthPageProps {
  onNavigate?: (page: string) => void;
}

function AuthPageContent({ onNavigate }: AuthPageProps) {
  const { signin, signup } = useAuth();
  const [activeTab, setActiveTab] = useState("signin");
  
  // Sign in state
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signinError, setSigninError] = useState("");
  const [signinLoading, setSigninLoading] = useState(false);

  // Sign up state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigninError("");
    setSigninLoading(true);

    try {
      await signin(signinEmail, signinPassword);
      onNavigate && onNavigate("/");
    } catch (error: any) {
      setSigninError(error.message || "로그인에 실패했습니다.");
    } finally {
      setSigninLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupSuccess(false);
    setSignupLoading(true);

    try {
      await signup(signupEmail, signupPassword, signupName);
      setSignupSuccess(true);
      // Clear form
      setSignupName("");
      setSignupEmail("");
      setSignupPassword("");
      // Redirect after successful signup
      setTimeout(() => {
        onNavigate && onNavigate("/");
      }, 1500);
    } catch (error: any) {
      setSignupError(error.message || "회원가입에 실패했습니다.");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="w-10 h-10 text-primary" />
            <h1 className="text-foreground">Business Card CRM</h1>
          </div>
          <p className="text-muted-foreground">
            명함 기반 B2B 고객 관리 시스템
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
            <CardDescription>
              사전 등록된 이메일만 로그인 가능합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">로그인</TabsTrigger>
                <TabsTrigger value="signup">회원가입</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignin} className="space-y-4">
                  {signinError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{signinError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signin-email">이메일</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="email@example.com"
                      value={signinEmail}
                      onChange={(e) => setSigninEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">비밀번호</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="비밀번호를 입력하세요"
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={signinLoading}
                  >
                    {signinLoading ? "로그인 중..." : "로그인"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  {signupError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{signupError}</AlertDescription>
                    </Alert>
                  )}

                  {signupSuccess && (
                    <Alert className="border-green-500 text-green-700 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        회원가입이 완료되었습니다. 로그인 중...
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">이름</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="홍길동"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">이메일</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="email@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                    <p className="text-muted-foreground">
                      화이트리스트에 등록된 이메일만 가입 가능합니다
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">비밀번호</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="비밀번호를 입력하세요"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={signupLoading || signupSuccess}
                  >
                    {signupLoading ? "가입 중..." : "회원가입"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center space-y-2">
          <Alert>
            <CheckCircle className="h-4 h-4" />
            <AlertDescription>
              <strong>첫 번째 사용자는 자동으로 관리자가 됩니다.</strong><br />
              회원가입 후 설정 페이지에서 다른 사용자를 화이트리스트에 추가할 수 있습니다.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}

function AuthPage({ onNavigate }: AuthPageProps) {
  return (
    <AuthProvider>
      <AuthPageContent onNavigate={onNavigate} />
    </AuthProvider>
  );
}

export default AuthPage;
