# Business Card CRM 관리자 설정 가이드

이 가이드는 Business Card CRM 시스템에 로그인 기능을 설정하는 방법을 설명합니다.

## 1. Supabase 설정

### 1.1 데이터베이스 설정
1. Supabase 대시보드에 로그인합니다.
2. SQL Editor로 이동합니다.
3. `setup-auth-system.sql` 파일의 내용을 복사하여 실행합니다.

```sql
-- setup-auth-system.sql 파일의 전체 내용을 실행
```

### 1.2 인증 설정
1. Supabase 대시보드에서 **Authentication** > **Settings**로 이동합니다.
2. **Auth Providers** 섹션에서 **Email**을 활성화합니다.
3. **Email Confirmation**을 비활성화합니다 (선택사항).
4. **Site URL**을 설정합니다 (예: `http://localhost:3000` 또는 실제 도메인).

## 2. 관리자 계정 생성

### 2.1 첫 번째 관리자 계정 생성
1. Supabase 대시보드의 **Authentication** > **Users**로 이동합니다.
2. **Add user** 버튼을 클릭합니다.
3. 이메일과 비밀번호를 입력하여 사용자를 생성합니다.
4. 생성된 사용자의 ID를 복사합니다.

### 2.2 관리자 권한 부여
SQL Editor에서 다음 쿼리를 실행하여 사용자를 관리자로 설정합니다:

```sql
-- 사용자 ID를 실제 ID로 변경하세요
SELECT add_admin_to_whitelist('admin@example.com');

-- 또는 직접 user_profiles 테이블을 업데이트
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

### 2.3 기존 데이터에 사용자 ID 설정
기존 명함 데이터가 있다면 관리자 계정에 연결합니다:

```sql
-- 관리자 사용자 ID로 변경하세요
UPDATE public.contacts 
SET user_id = 'YOUR_ADMIN_USER_ID' 
WHERE user_id IS NULL;

UPDATE public.ai_analysis 
SET user_id = 'YOUR_ADMIN_USER_ID' 
WHERE user_id IS NULL;
```

## 3. 사용자 계정 관리

### 3.1 사용자 화이트리스트에 추가
새로운 사용자를 추가하려면:

```sql
-- 일반 사용자 추가
INSERT INTO public.user_whitelist (email, role) 
VALUES ('user@example.com', 'user');

-- 관리자 사용자 추가
INSERT INTO public.user_whitelist (email, role) 
VALUES ('admin@example.com', 'admin');
```

### 3.2 사용자 제거
사용자를 제거하려면:

```sql
-- 화이트리스트에서 제거
DELETE FROM public.user_whitelist 
WHERE email = 'user@example.com';

-- 사용자 프로필 제거 (auth.users는 자동으로 삭제됨)
DELETE FROM public.user_profiles 
WHERE email = 'user@example.com';
```

## 4. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수들이 설정되어 있는지 확인하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 5. 권한 및 보안

### 5.1 RLS (Row Level Security) 정책
시스템은 다음과 같은 보안 정책을 적용합니다:

- **사용자**: 자신의 명함 데이터만 조회/수정 가능
- **관리자**: 모든 사용자의 데이터 조회/수정 가능
- **화이트리스트**: 등록된 이메일만 회원가입 가능

### 5.2 데이터 접근 제어
- `contacts` 테이블: 사용자는 `user_id`가 자신인 레코드만 접근
- `ai_analysis` 테이블: 사용자는 `user_id`가 자신인 레코드만 접근
- `user_profiles` 테이블: 사용자는 자신의 프로필만 접근
- `user_whitelist` 테이블: 관리자만 접근 가능

## 6. 테스트

### 6.1 관리자 로그인 테스트
1. 애플리케이션을 실행합니다.
2. 관리자 계정으로 로그인합니다.
3. 모든 명함 데이터를 볼 수 있는지 확인합니다.

### 6.2 사용자 로그인 테스트
1. 일반 사용자 계정을 생성합니다.
2. 해당 계정으로 로그인합니다.
3. 자신의 명함 데이터만 볼 수 있는지 확인합니다.

## 7. 문제 해결

### 7.1 로그인 실패
- 이메일이 화이트리스트에 등록되어 있는지 확인
- Supabase 인증 설정이 올바른지 확인
- 환경 변수가 올바르게 설정되었는지 확인

### 7.2 데이터 접근 문제
- RLS 정책이 올바르게 설정되었는지 확인
- 사용자 프로필이 올바르게 생성되었는지 확인
- 데이터베이스 연결이 정상인지 확인

### 7.3 권한 문제
- 사용자 역할이 올바르게 설정되었는지 확인
- API 엔드포인트에 인증 토큰이 포함되었는지 확인

## 8. 유지보수

### 8.1 정기적인 사용자 관리
- 사용하지 않는 계정 정리
- 화이트리스트 정리
- 사용자 권한 검토

### 8.2 보안 업데이트
- Supabase 보안 업데이트 적용
- RLS 정책 검토 및 업데이트
- API 엔드포인트 보안 검토

이 가이드를 따라 설정하면 안전하고 효율적인 사용자 인증 시스템을 구축할 수 있습니다.
