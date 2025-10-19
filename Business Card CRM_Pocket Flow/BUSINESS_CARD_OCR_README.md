# 명함 OCR 기능 구현 가이드

## 🎯 구현된 기능

### ✅ 완료된 작업
- **명함 이미지 업로드/촬영**: 카메라 또는 파일 업로드 지원
- **Google Vision OCR**: 텍스트 자동 추출 및 필드 파싱
- **자동 폼 채움**: 이름, 직책, 부서, 회사, 이메일, 전화번호 자동 입력
- **Supabase 연동**: 이미지 스토리지 및 연락처 데이터 저장
- **반응형 UI**: 다크모드 지원, Tailwind CSS 스타일링
- **폼 검증**: Zod를 사용한 클라이언트/서버 검증

## 📁 생성된 파일 구조

```
├── lib/
│   ├── supabaseClient.ts      # 브라우저용 Supabase 클라이언트
│   ├── supabaseAdmin.ts       # 서버용 Supabase 관리자 클라이언트
│   └── googleVision.ts        # Google Vision API 클라이언트
├── pages/
│   ├── api/
│   │   ├── ocr.ts            # OCR 텍스트 추출 API
│   │   └── save-contact.ts   # 연락처 저장 API
│   └── index.tsx             # 홈 페이지 (명함 등록 UI)
├── components/ui/
│   └── textarea.tsx          # 텍스트 영역 컴포넌트
├── supabase-setup.sql        # Supabase 데이터베이스 설정
└── env.example              # 환경변수 템플릿
```

## 🚀 설정 방법

### 1. 환경변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Vision API 설정
GOOGLE_APPLICATION_CREDENTIALS_B64=your_base64_encoded_service_account_json

# 앱 설정
NEXT_PUBLIC_STORAGE_BUCKET=business-cards
```

### 2. Google Vision API 설정
1. Google Cloud Console에서 Vision API 활성화
2. 서비스 계정 생성 및 JSON 키 다운로드
3. JSON 파일을 Base64로 인코딩:
   ```bash
   base64 -i service-account.json
   ```
4. 인코딩된 문자열을 `GOOGLE_APPLICATION_CREDENTIALS_B64`에 설정

### 3. Supabase 설정
1. Supabase 프로젝트 생성
2. `supabase-setup.sql` 파일을 SQL Editor에서 실행
3. Storage 버킷과 테이블이 자동으로 생성됩니다

## 🎨 사용법

### 홈 페이지 접근
- URL: `http://localhost:3000`
- 명함 이미지 업로드/촬영
- "텍스트 추출" 버튼으로 OCR 실행
- 자동으로 채워진 정보 확인 및 수정
- "저장하기" 버튼으로 Supabase에 저장

### API 엔드포인트

#### POST `/api/ocr`
명함 이미지에서 텍스트 추출
```json
{
  "imageBase64": "data:image/jpeg;base64,..."
}
```

#### POST `/api/save-contact`
연락처 정보 저장
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "imageExt": "jpg",
  "name": "홍길동",
  "title": "대표이사",
  "department": "경영진",
  "company": "ABC회사",
  "email": "hong@abc.com",
  "phone": "010-1234-5678",
  "importance": 3,
  "inquiryTypes": ["견적요청", "회사소개서"],
  "memo": "대화 내용"
}
```

## 🔧 기술 스택

- **Frontend**: Next.js 14.2.33, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Validation**: Zod
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **OCR**: Google Cloud Vision API
- **Icons**: Lucide React

## 🛡️ 보안 고려사항

- Google Vision API 키는 서버에서만 사용
- Supabase Service Role 키는 API 라우트에서만 사용
- Storage 버킷은 private으로 설정
- 이미지 접근은 서명된 URL로만 가능
- RLS(Row Level Security) 정책으로 데이터 보호

## 🧪 테스트 시나리오

1. **이미지 업로드 테스트**
   - 명함 이미지 업로드
   - OCR 텍스트 추출 확인
   - 자동 필드 채움 확인

2. **데이터 저장 테스트**
   - 폼 검증 동작 확인
   - Supabase 저장 성공 확인
   - 이미지 스토리지 업로드 확인

3. **에러 처리 테스트**
   - 잘못된 이미지 형식
   - 필수 필드 누락
   - 네트워크 오류

## 📝 향후 개선 사항

- [ ] 사용자 인증 시스템 추가
- [ ] 명함 목록 조회 기능
- [ ] 검색 및 필터링 기능
- [ ] 명함 정보 수정/삭제 기능
- [ ] 다국어 지원
- [ ] 배치 업로드 기능
- [ ] AI 기반 연락처 분류

## 🐛 문제 해결

### 일반적인 문제들

1. **OCR이 작동하지 않는 경우**
   - Google Vision API 키 확인
   - 이미지 형식 확인 (JPEG, PNG 지원)
   - 이미지 크기 확인 (10MB 이하)

2. **Supabase 연결 오류**
   - 환경변수 설정 확인
   - Supabase 프로젝트 상태 확인
   - RLS 정책 확인

3. **이미지 업로드 실패**
   - Storage 버킷 설정 확인
   - 파일 크기 제한 확인
   - 권한 설정 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 환경변수 설정
2. Supabase 프로젝트 상태
3. Google Cloud Console 설정
4. 브라우저 개발자 도구 콘솔
5. 서버 로그
