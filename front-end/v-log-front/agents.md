# V-Log Frontend - AI Agent 가이드

이 문서는 V-Log 프론트엔드 프로젝트의 구조와 주요 패턴을 이해하는 데 도움이 되는 가이드입니다.

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [주요 기능](#주요-기능)
5. [아키텍처 패턴](#아키텍처-패턴)
6. [API 엔드포인트 상세](#api-엔드포인트-상세)
7. [타입 정의](#타입-정의)
8. [라우팅](#라우팅)
9. [스타일링](#스타일링)
10. [주요 컴포넌트](#주요-컴포넌트)
11. [커스텀 훅](#커스텀-훅)
12. [코딩 컨벤션](#코딩-컨벤션)
13. [주의사항](#주의사항)
14. [에러 처리 패턴](#에러-처리-패턴)
15. [개발 가이드](#개발-가이드)
16. [실제 사용 예제](#실제-사용-예제)
17. [중요한 패턴과 베스트 프랙티스](#중요한-패턴과-베스트-프랙티스)
18. [자주 발생하는 문제와 해결책](#자주-발생하는-문제와-해결책)
19. [디버깅 팁](#디버깅-팁)

## 프로젝트 개요

V-Log는 블로그 플랫폼 프론트엔드 애플리케이션으로, React 18과 TypeScript를 기반으로 구축되었습니다.

## 기술 스택

- **프레임워크**: React 18.2.0
- **언어**: TypeScript 5.2.2
- **빌드 도구**: Vite 5.0.8
- **라우팅**: React Router DOM 6.20.0
- **HTTP 클라이언트**: Axios 1.6.0
- **스타일링**: Tailwind CSS 3.4.0
- **마크다운**: ReactMarkdown 10.1.0, remark-gfm 4.0.1
- **상태 관리**: React Context API
- **날짜 처리**: date-fns 2.30.0

## 프로젝트 구조

```
src/
├── api/              # API 클라이언트 모듈
│   ├── auth.ts       # 인증 API
│   ├── client.ts     # Axios 인스턴스 및 에러 처리
│   ├── comments.ts   # 댓글 API
│   ├── follows.ts    # 팔로우 API
│   ├── likes.ts      # 좋아요 API
│   ├── posts.ts      # 게시글 API
│   ├── tags.ts       # 태그 API
│   └── users.ts      # 사용자 API
├── components/       # 재사용 가능한 컴포넌트
│   ├── common/       # 공통 컴포넌트 (LoadingSpinner, ErrorMessage)
│   ├── Header.tsx    # 헤더 컴포넌트
│   ├── Footer.tsx    # 푸터 컴포넌트
│   ├── Navigation.tsx # 정렬/필터 네비게이션
│   ├── PostCard.tsx  # 게시글 카드 (React.memo 적용)
│   ├── PostGrid.tsx  # 게시글 그리드 (React.memo 적용)
│   ├── ProtectedRoute.tsx # 인증 보호 라우트
│   └── TagFilter.tsx # 태그 필터 컴포넌트
├── context/          # React Context
│   ├── AuthContext.tsx # 인증 상태 관리
│   └── ThemeContext.tsx # 테마 상태 관리
├── hooks/            # 커스텀 훅
│   ├── useFollow.ts  # 팔로우 기능 훅
│   ├── useMarkdownEditor.ts # 마크다운 에디터 훅
│   ├── usePostLike.ts # 좋아요 기능 훅
│   └── useSearchParams.ts # URL 파라미터 처리 훅
├── pages/            # 페이지 컴포넌트
│   ├── HomePage.tsx  # 홈 페이지 (게시글 목록)
│   ├── LoginPage.tsx # 로그인 페이지
│   ├── SignupPage.tsx # 회원가입 페이지
│   ├── PostCreatePage.tsx # 게시글 작성 페이지
│   ├── PostEditPage.tsx # 게시글 수정 페이지
│   ├── PostDetailPage.tsx # 게시글 상세 페이지
│   ├── ProfilePage.tsx # 프로필 페이지
│   └── ProfileEditPage.tsx # 프로필 수정 페이지
├── types/            # TypeScript 타입 정의
│   └── index.ts      # 모든 타입 정의
├── utils/            # 유틸리티 함수
│   ├── constants.ts  # 상수 정의
│   ├── date.ts       # 날짜 포맷팅
│   ├── follow.ts     # 팔로우 상태 확인
│   ├── storage.ts    # localStorage 관리
│   └── text.ts       # 텍스트 처리
└── styles/           # 전역 스타일
    └── index.css     # Tailwind CSS 및 커스텀 스타일
```

## 주요 기능

### 1. 인증 시스템
- **로그인/회원가입**: 세션 기반 인증
- **세션 복원**: localStorage를 통한 자동 로그인
- **보호된 라우트**: `ProtectedRoute` 컴포넌트로 인증 필요 페이지 보호

### 2. 게시글 관리
- **CRUD 작업**: 게시글 작성, 조회, 수정, 삭제
- **마크다운 지원**: 실시간 마크다운 미리보기
- **태그 시스템**: 태그 기반 필터링 (OR, AND, NAND 모드)
- **검색 기능**: 제목, 작성자 검색
- **정렬**: 생성일, 좋아요 수 등으로 정렬
- **페이지네이션**: 무한 스크롤 대신 페이지 번호 기반

### 3. 좋아요 시스템
- **낙관적 업데이트**: 즉시 UI 반영 후 서버 동기화
- **409 에러 처리**: 이미 좋아요한 경우 자동 처리
- **비회원 지원**: 비회원도 좋아요 수 조회 가능

### 4. 댓글 시스템
- **댓글 CRUD**: 댓글 작성, 수정, 삭제
- **답글 기능**: 1-depth 답글 지원
- **실시간 업데이트**: 댓글 작성/수정/삭제 즉시 반영

### 5. 팔로우 시스템
- **팔로우/언팔로우**: 사용자 팔로우 관리
- **팔로워/팔로잉 목록**: 모달을 통한 목록 조회
- **상태 확인**: 현재 로그인 사용자 기준 팔로우 상태 표시

### 6. 프로필 관리
- **프로필 조회**: 본인 및 다른 사용자 프로필 조회
- **프로필 수정**: 닉네임, 비밀번호 변경
- **게시글 목록**: 사용자별 게시글 목록 표시

## 아키텍처 패턴

### 1. API 통신
- **Axios 인스턴스**: `apiClient`를 통한 중앙화된 API 설정
  - Base URL: `/api/v1`
  - `withCredentials: true` (세션 쿠키 자동 전송)
  - Content-Type: `application/json`
- **에러 처리**: `handleApiError` 유틸리티로 통일된 에러 처리
- **응답 래핑**: 모든 API 응답은 `ApiResponse<T>` 형태
  ```typescript
  interface ApiResponse<T> {
    message: string;
    data: T;
  }
  ```
- **중요**: API 모듈들은 이미 `ApiResponse<T>`를 반환하므로, `response.data`가 바로 `ApiResponse<T>`입니다.
  ```typescript
  // ✅ 올바른 사용
  const response = await postsApi.getPost(postId);
  // response는 이미 PostResponse 타입
  
  // ❌ 잘못된 사용
  const response = await apiClient.get(`/posts/${postId}`);
  const data = response.data.data; // 불필요한 중첩 접근
  ```

### 2. 상태 관리
- **Context API**: 인증(`AuthContext`), 테마(`ThemeContext`) 상태 관리
- **로컬 상태**: 컴포넌트별 `useState`로 UI 상태 관리
- **세션 저장**: `localStorage`를 통한 사용자 정보 영구 저장

### 3. 성능 최적화
- **React.memo**: `PostCard`, `PostGrid` 컴포넌트 메모이제이션
- **useCallback**: 이벤트 핸들러 메모이제이션
- **useMemo**: 계산 비용이 큰 값들 메모이제이션
- **낙관적 업데이트**: 좋아요, 팔로우 등 즉시 UI 반영

### 4. 커스텀 훅 패턴
- **로직 분리**: 재사용 가능한 로직을 커스텀 훅으로 분리
- **관심사 분리**: 각 훅은 단일 책임 원칙 준수
- **타입 안정성**: 모든 훅은 TypeScript로 타입 정의

## 라우팅

### 라우트 구조
```typescript
/                    # 홈 (게시글 목록)
/login              # 로그인
/signup             # 회원가입
/posts/new          # 게시글 작성
/posts/:postId      # 게시글 상세
/posts/:postId/edit # 게시글 수정
/profile            # 본인 프로필
/profile/:userId    # 다른 사용자 프로필
/profile/edit       # 프로필 수정 (보호됨)
```

### URL 파라미터
- **검색**: `?keyword=검색어&search=TITLE|NICKNAME`
- **정렬**: `?sort=CREATED_AT|LIKE_COUNT&asc=true|false`
- **태그**: `?tag=태그1&tag=태그2&tagMode=OR|AND|NAND`
- **페이지**: `?page=0` (0부터 시작)

## 스타일링

### Tailwind CSS
- **다크 모드**: `dark:` 접두사로 다크 모드 스타일링
- **반응형**: `sm:`, `md:`, `lg:`, `xl:` 브레이크포인트 사용
- **커스텀 색상**: `primary`, `secondary`, `muted`, `foreground`, `background` 등

### Material Symbols
- **아이콘**: Google Material Symbols 사용
- **클래스**: `material-symbols-outlined`

## 주요 컴포넌트

### PostCard
- **메모이제이션**: `React.memo` 적용
- **프롭스**: `PostListResponse` 타입의 `post` 객체
- **기능**: 클릭 시 게시글 상세 페이지로 이동

### PostGrid
- **메모이제이션**: `React.memo` 적용
- **레이아웃**: 반응형 그리드 (1/2/3/4 열)
- **빈 상태**: 게시글이 없을 때 안내 메시지 표시

### Header
- **검색 기능**: 제목/작성자 검색
- **테마 토글**: 다크/라이트 모드 전환
- **프로필 메뉴**: 드롭다운 메뉴 (My Profile, Logout)

## 커스텀 훅

### usePostLike
좋아요 기능을 관리하는 훅
```typescript
const { likeCount, isLiked, likeLoading, handleLike } = usePostLike(
  postId,
  initialLikeCount,
  initialIsLiked,
  isAuthenticated
);
```

### useFollow
팔로우 기능을 관리하는 훅
```typescript
const { isFollowing, followLoading, handleFollow } = useFollow(
  targetUserId,
  isOwnProfile,
  isAuthenticated,
  onFollowChange
);
```

### useSearchParams
URL 파라미터를 파싱하는 훅
```typescript
const [queryParams, setSearchParams] = useSearchParams();
// queryParams: { sort, asc, keyword, search, tags, tagMode, page }
```

### useMarkdownEditor
마크다운 에디터 기능을 제공하는 훅
```typescript
const { contentTextareaRef, titleTextareaRef, insertTextAtCursor, insertMarkdown } = 
  useMarkdownEditor(content, title, setContent);
```

## API 엔드포인트 상세

### 인증 API (`/api/v1/auth`)
```typescript
// 로그인
POST /auth/login
Body: { email: string, password: string }
Response: ApiResponse<UserGetResponse>

// 회원가입
POST /auth/signup
Body: { email: string, password: string, nickname: string }
Response: ApiResponse<UserGetResponse>

// 로그아웃
POST /auth/logout
Response: ApiResponse<string>
```

### 게시글 API (`/api/v1/posts`)
```typescript
// 목록 조회 (인증 불필요)
GET /posts?page=0&size=12&sort=CREATED_AT&asc=false&keyword=검색어&search=TITLE&tag[]=태그1&tagMode=OR
Response: PageResponse<PostListResponse>

// 상세 조회 (인증 불필요)
GET /posts/{postId}
Response: ApiResponse<PostResponse>

// 작성 (인증 필요)
POST /posts
Body: { title: string, content: string, tags?: string[] }
Response: ApiResponse<PostResponse>

// 수정 (인증 필요, 작성자만)
PUT /posts/{postId}
Body: { title: string, content: string, tags?: string[] }
Response: ApiResponse<PostResponse>

// 삭제 (인증 필요, 작성자만)
DELETE /posts/{postId}
Response: void
```

### 댓글 API (`/api/v1/posts/{postId}/comments`)
```typescript
// 목록 조회 (인증 불필요)
GET /posts/{postId}/comments
Response: ApiResponse<CommentWithRepliesGetResponse[]>

// 댓글 작성 (인증 필요)
POST /posts/{postId}/comments
Body: { content: string }
Response: ApiResponse<CommentPostResponse>

// 댓글 수정 (인증 필요, 작성자만)
PUT /posts/{postId}/comments/{commentId}
Body: { content: string }
Response: ApiResponse<CommentPutResponse>

// 댓글 삭제 (인증 필요, 작성자만)
DELETE /posts/{postId}/comments/{commentId}
Response: ApiResponse<void>

// 답글 작성 (인증 필요, 1-depth만 지원)
POST /posts/{postId}/comments/{commentId}/replies
Body: { content: string }
Response: ApiResponse<ReplyPostResponse>

// 답글 수정 (인증 필요, 작성자만)
PUT /posts/{postId}/comments/{commentId}/replies/{replyId}
Body: { content: string }
Response: ApiResponse<ReplyPutResponse>

// 답글 삭제 (인증 필요, 작성자만)
DELETE /posts/{postId}/comments/{commentId}/replies/{replyId}
Response: ApiResponse<void>
```

### 좋아요 API (`/api/v1/posts/{postId}/like`)
```typescript
// 조회 (인증 선택, 비회원도 가능)
GET /posts/{postId}/like
Response: ApiResponse<LikeResponse>

// 좋아요 추가 (인증 필요)
POST /posts/{postId}/like
Response: ApiResponse<LikeResponse>
// 409 Conflict: 이미 좋아요한 경우

// 좋아요 취소 (인증 필요)
DELETE /posts/{postId}/like
Response: ApiResponse<LikeResponse>
```

### 팔로우 API (`/api/v1/users/{userId}/follows`)
```typescript
// 팔로우 (인증 필요)
POST /users/{userId}/follows
Response: ApiResponse<FollowPostResponse>
// 409 Conflict: 이미 팔로우한 경우

// 언팔로우 (인증 필요)
DELETE /users/{userId}/follows
Response: ApiResponse<FollowDeleteResponse>
// 404 Not Found: 팔로우하지 않은 경우

// 팔로워 목록 조회 (인증 불필요)
GET /users/{userId}/followers?page=0&size=20
Response: ApiResponse<PageResponse<FollowerGetResponse>>

// 팔로잉 목록 조회 (인증 불필요)
GET /users/{userId}/followings?page=0&size=20
Response: ApiResponse<PageResponse<FollowingGetResponse>>
```

### 사용자 API (`/api/v1/users`)
```typescript
// 프로필 조회 (인증 불필요)
GET /users/{userId}
Response: ApiResponse<UserGetResponse>

// 프로필 수정 (인증 필요, 본인만)
PUT /users/{userId}
Body: { nickname?: string, password?: string }
Response: ApiResponse<UserGetResponse>

// 회원 탈퇴 (인증 필요, 본인만)
DELETE /users/{userId}
Body: { password: string }
Response: ApiResponse<void>
```

## 타입 정의

### 주요 타입
```typescript
// 게시글
interface PostListResponse {
  postId: number;
  title: string;
  content: string;
  author: Author;
  tags?: string[];
  likeCount?: number;
  commentCount?: number;
  createdAt: string;
  isLiked?: boolean; // 로그인 사용자의 좋아요 여부
}

interface PostResponse {
  postId: number;
  title: string;
  content: string;
  author: Author;
  tags: string[];
  likeCount?: number;
  createdAt: string;
  updatedAt: string;
}

// 사용자
interface User {
  userId: number;
  email: string;
  nickname: string;
}

interface UserGetResponse {
  id: number;
  email: string;
  nickname: string;
  blogId: number;
  blogTitle: string;
}

// 좋아요
interface LikeResponse {
  likeCount: number;
  checkLike: boolean; // 현재 사용자의 좋아요 여부
}

// 댓글
interface CommentWithRepliesGetResponse {
  commentId: number;
  content: string;
  author: Author;
  createdAt: string;
  updatedAt: string;
  replies: ReplyGetResponse[]; // 1-depth 답글만
}

interface ReplyGetResponse {
  replyId: number;
  content: string;
  author: Author;
  createdAt: string;
  updatedAt: string;
}

// 팔로우
interface FollowerGetResponse {
  userId: number;
  nickname: string;
  isFollowing: boolean; // 현재 로그인 사용자가 팔로우 중인지
}

interface FollowingGetResponse {
  userId: number;
  nickname: string;
  isFollowing: boolean; // 현재 로그인 사용자가 팔로우 중인지
}

// 페이지네이션
interface PageInfo {
  page: number; // 0부터 시작
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface PageResponse<T> {
  content: T[];
  pageInfo: PageInfo;
}

// 공통
interface Author {
  userId: number;
  nickname: string;
}

interface ApiResponse<T> {
  message: string;
  data: T;
}
```

## 코딩 컨벤션

### 1. 파일 명명
- **컴포넌트**: PascalCase (예: `PostCard.tsx`)
- **유틸리티**: camelCase (예: `date.ts`)
- **타입**: camelCase (예: `index.ts`)

### 2. 컴포넌트 구조
```typescript
// 1. Imports
// 2. Types/Interfaces
// 3. Component
// 4. Export
```

### 3. 상태 관리
- **로컬 상태**: `useState`
- **전역 상태**: Context API
- **서버 상태**: 컴포넌트 내부 `useState` + `useEffect`

### 4. 에러 처리
- **API 에러**: `handleApiError` 사용
- **사용자 알림**: `alert` 또는 에러 메시지 표시
- **콘솔 로그**: 개발 환경에서만 사용

## 주의사항

### 1. API 응답 구조
**중요**: API 모듈(`postsApi`, `commentsApi` 등)은 이미 `ApiResponse<T>`를 언래핑하여 반환합니다.

```typescript
// ✅ 올바른 사용 (API 모듈 사용)
const post = await postsApi.getPost(postId);
// post는 PostResponse 타입 (이미 언래핑됨)

const posts = await postsApi.getPosts({ page: 0, size: 12 });
// posts는 PageResponse<PostListResponse> 타입

// ✅ 올바른 사용 (직접 apiClient 사용 시)
const response = await apiClient.get<ApiResponse<PostResponse>>(`/posts/${postId}`);
const post = response.data.data; // ApiResponse를 언래핑

// ❌ 잘못된 사용
const response = await postsApi.getPost(postId);
const post = response.data.data; // 이미 언래핑되어 있으므로 에러
```

**API 모듈별 반환 타입**:
- `postsApi.getPost()`: `PostResponse` (언래핑됨)
- `postsApi.getPosts()`: `PageResponse<PostListResponse>` (언래핑됨)
- `commentsApi.getComments()`: `ApiResponse<CommentWithRepliesGetResponse[]>` (래핑됨)
- `likesApi.getLikeInfo()`: `ApiResponse<LikeResponse>` (래핑됨)
- `likesApi.addLike()`: `ApiResponse<LikeResponse>` (래핑됨)
- `followsApi.getFollowers()`: `ApiResponse<PageResponse<FollowerGetResponse>>` (래핑됨)

### 2. 인증 상태
- **비회원 지원**: 일부 기능은 비회원도 사용 가능
  - 게시글 조회 (목록, 상세)
  - 댓글 조회
  - 좋아요 수 조회 (`checkLike`는 `false`)
  - 프로필 조회
  - 팔로워/팔로잉 목록 조회
- **세션 복원**: 페이지 새로고침 시 localStorage에서 세션 복원
  - `AuthContext`의 `useEffect`에서 자동 처리
  - 세션 유효성 확인을 위해 `/users/{userId}` API 호출
  - 401/403 에러 시 localStorage 정리
- **에러 처리**: 
  - 401 Unauthorized: 세션 만료, 자동 로그아웃
  - 403 Forbidden: 권한 없음, 에러 메시지 표시
  - 404 Not Found: 리소스 없음, 에러 메시지 표시
  - 409 Conflict: 이미 존재 (좋아요, 팔로우), 정상 처리로 간주

### 3. 낙관적 업데이트
좋아요, 팔로우 등은 낙관적 업데이트 패턴을 사용합니다:
1. 즉시 UI 업데이트
2. API 호출
3. 실패 시 롤백

### 4. 페이지네이션
- **0부터 시작**: 페이지 번호는 0부터 시작
- **URL 동기화**: 페이지 변경 시 URL 파라미터 업데이트
- **스크롤**: 페이지 변경 시 상단으로 스크롤

### 5. 타입 안정성
- **any 타입 지양**: 가능한 한 구체적인 타입 사용
- **타입 가드**: 런타임 타입 체크 필요 시 타입 가드 사용
- **옵셔널 체이닝**: `?.` 연산자로 안전한 접근

## 에러 처리 패턴

### HTTP 상태 코드별 처리
```typescript
try {
  await someApi.call();
} catch (error: unknown) {
  const apiError = handleApiError(error);
  
  switch (apiError.status) {
    case 401:
      // 세션 만료 - 자동 로그아웃 처리됨
      navigate('/login');
      break;
    case 403:
      // 권한 없음
      alert('권한이 없습니다.');
      break;
    case 404:
      // 리소스 없음
      alert('찾을 수 없습니다.');
      break;
    case 409:
      // 이미 존재 (좋아요, 팔로우 등)
      // 정상 처리로 간주, 에러 표시하지 않음
      break;
    default:
      alert(apiError.message);
  }
}
```

### 낙관적 업데이트 패턴
```typescript
// 좋아요 예제
const handleLike = async () => {
  // 1. 즉시 UI 업데이트 (낙관적 업데이트)
  const previousIsLiked = isLiked;
  setIsLiked(!isLiked);
  setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  
  try {
    // 2. API 호출
    if (previousIsLiked) {
      await likesApi.removeLike(postId);
    } else {
      await likesApi.addLike(postId);
    }
    // 3. 성공 시 낙관적 업데이트 유지
  } catch (error) {
    // 4. 실패 시 롤백
    setIsLiked(previousIsLiked);
    setLikeCount(prev => previousIsLiked ? prev + 1 : prev - 1);
    handleApiError(error);
  }
};
```

## 개발 가이드

### 새 기능 추가 시
1. **API 클라이언트**: `src/api/`에 새 API 모듈 추가
   ```typescript
   // src/api/example.ts
   import { apiClient } from './client';
   import { ApiResponse, ExampleResponse } from '../types';
   
   export const exampleApi = {
     getExample: async (id: number): Promise<ExampleResponse> => {
       const response = await apiClient.get<ApiResponse<ExampleResponse>>(`/example/${id}`);
       return response.data.data; // 언래핑
     },
   };
   ```

2. **타입 정의**: `src/types/index.ts`에 타입 추가
   ```typescript
   export interface ExampleResponse {
     id: number;
     name: string;
   }
   ```

3. **컴포넌트**: 필요 시 `src/components/`에 컴포넌트 추가
   - 재사용 가능한 컴포넌트는 `React.memo` 고려
   - 이벤트 핸들러는 `useCallback` 사용

4. **페이지**: `src/pages/`에 페이지 추가
   - 인증 필요 시 `ProtectedRoute`로 감싸기

5. **라우트**: `App.tsx`에 라우트 추가
   ```typescript
   <Route path="/example" element={<ExamplePage />} />
   ```

### 성능 최적화
- **불필요한 리렌더링 방지**: 
  - `React.memo`: 프롭스가 변경되지 않으면 리렌더링 방지
  - `useCallback`: 함수 참조 안정화
  - `useMemo`: 계산 비용이 큰 값 메모이제이션
- **코드 스플리팅**: 필요 시 `React.lazy` 사용
- **이미지 최적화**: 필요 시 이미지 최적화 라이브러리 사용

### 테스트
현재 테스트 코드는 없지만, 향후 추가 시:
- **단위 테스트**: Jest + React Testing Library
- **E2E 테스트**: Playwright 또는 Cypress

## 실제 사용 예제

### 게시글 목록 조회
```typescript
const [posts, setPosts] = useState<PostListResponse[]>([]);
const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);

useEffect(() => {
  const fetchPosts = async () => {
    try {
      const response = await postsApi.getPosts({
        page: 0,
        size: 12,
        sort: 'CREATED_AT',
        asc: false,
      });
      setPosts(response.content);
      setPageInfo(response.pageInfo);
    } catch (error) {
      const apiError = handleApiError(error);
      console.error(apiError.message);
    }
  };
  fetchPosts();
}, []);
```

### 좋아요 기능 (커스텀 훅 사용)
```typescript
const { likeCount, isLiked, likeLoading, handleLike } = usePostLike(
  postId,
  0, // initialLikeCount
  false, // initialIsLiked
  isAuthenticated
);

// UI에서 사용
<button onClick={handleLike} disabled={likeLoading}>
  {isLiked ? '❤️' : '🤍'} {likeCount}
</button>
```

### 댓글 작성
```typescript
const handleSubmitComment = async () => {
  if (!newComment.trim()) return;
  
  try {
    const response = await commentsApi.createComment(postId, {
      content: newComment.trim(),
    });
    
    // 댓글 목록에 추가
    setComments(prev => [...prev, {
      commentId: response.data.commentId,
      content: response.data.content,
      author: response.data.author,
      createdAt: response.data.createdAt,
      updatedAt: response.data.createdAt,
      replies: [],
    }]);
    
    setNewComment('');
  } catch (error) {
    const apiError = handleApiError(error);
    alert(apiError.message);
  }
};
```

### 팔로우 기능 (커스텀 훅 사용)
```typescript
const { isFollowing, followLoading, handleFollow } = useFollow(
  targetUserId,
  isOwnProfile,
  isAuthenticated,
  (isFollowing) => {
    // 팔로우 상태 변경 시 콜백
    if (isFollowing) {
      setFollowersCount(prev => prev + 1);
    } else {
      setFollowersCount(prev => Math.max(0, prev - 1));
    }
  }
);

// UI에서 사용
<button onClick={handleFollow} disabled={followLoading}>
  {isFollowing ? '언팔로우' : '팔로우'}
</button>
```

## 중요한 패턴과 베스트 프랙티스

### 1. API 모듈 사용 우선
직접 `apiClient`를 사용하는 대신, API 모듈(`postsApi`, `commentsApi` 등)을 사용하세요.
```typescript
// ✅ 권장
const post = await postsApi.getPost(postId);

// ❌ 비권장 (특별한 경우가 아니면)
const response = await apiClient.get(`/posts/${postId}`);
```

### 2. 에러 처리 일관성
모든 API 호출은 `try-catch`로 감싸고 `handleApiError`를 사용하세요.
```typescript
try {
  await someApi.call();
} catch (error: unknown) {
  const apiError = handleApiError(error);
  // 에러 처리
}
```

### 3. 낙관적 업데이트 활용
사용자 경험을 위해 좋아요, 팔로우 등은 낙관적 업데이트를 사용하세요.

### 4. 타입 안정성 유지
- `any` 타입 사용 지양
- 옵셔널 체이닝(`?.`) 활용
- 타입 가드 사용

### 5. 성능 최적화
- 리스트 렌더링 시 `key` prop 필수
- 불필요한 리렌더링 방지 (`React.memo`, `useCallback`, `useMemo`)
- 큰 리스트는 가상화 고려

### 6. 접근성 고려
- 폼 필드에 `id`와 `name` 속성 추가
- 버튼에 `aria-label` 추가
- 키보드 네비게이션 지원

## 자주 발생하는 문제와 해결책

### 문제 1: API 응답 구조 혼란
**증상**: `response.data.data`로 접근했는데 `undefined` 발생
**원인**: API 모듈이 이미 언래핑하여 반환
**해결**: API 모듈의 반환 타입 확인 후 직접 사용
```typescript
// postsApi.getPost()는 PostResponse를 반환
const post = await postsApi.getPost(postId); // ✅
// const post = (await postsApi.getPost(postId)).data; // ❌
```

### 문제 2: 좋아요 수가 즉시 반영되지 않음
**증상**: 좋아요 클릭 후 숫자가 업데이트되지 않음
**원인**: 낙관적 업데이트 미적용 또는 API 응답 처리 오류
**해결**: `usePostLike` 훅 사용 또는 낙관적 업데이트 패턴 적용

### 문제 3: 세션 복원 실패
**증상**: 새로고침 후 로그인 상태가 사라짐
**원인**: localStorage에 저장된 세션이 만료됨
**해결**: `AuthContext`가 자동으로 처리하므로, 401/403 에러 시 정상 동작

### 문제 4: 팔로우 상태가 올바르지 않음
**증상**: 팔로워 목록에서 `isFollowing`이 잘못 표시됨
**원인**: 백엔드가 프로필 주인 기준으로 반환 (프론트엔드에서 수정됨)
**해결**: 프론트엔드에서 `checkFollowStatus`로 현재 로그인 사용자 기준 확인

## 디버깅 팁

### 1. API 호출 확인
```typescript
// 콘솔에 API 호출 로그 추가
console.log('API 호출:', endpoint, params);
const response = await api.call();
console.log('API 응답:', response);
```

### 2. 상태 확인
```typescript
// React DevTools 사용
// 또는 임시로 콘솔 로그 추가
useEffect(() => {
  console.log('상태 변경:', { posts, loading, error });
}, [posts, loading, error]);
```

### 3. 네트워크 탭 확인
- 브라우저 개발자 도구의 Network 탭에서 API 호출 확인
- 요청/응답 헤더 및 본문 확인
- 상태 코드 확인

## 참고 자료

- [React 공식 문서](https://react.dev)
- [TypeScript 공식 문서](https://www.typescriptlang.org)
- [Tailwind CSS 공식 문서](https://tailwindcss.com)
- [React Router 공식 문서](https://reactrouter.com)
- [Axios 공식 문서](https://axios-http.com)
- [React Markdown 공식 문서](https://github.com/remarkjs/react-markdown)

