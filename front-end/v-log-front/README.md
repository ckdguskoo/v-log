# V-Log Frontend

백엔드 API와 연결되는 velog 스타일의 블로그 프론트엔드입니다.

## 기술 스택

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios

## 설치 및 실행

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

### 3. 빌드

```bash
npm run build
```

## 백엔드 연결

프론트엔드는 `http://localhost:8080`의 백엔드 API와 통신합니다.

Vite의 프록시 설정을 통해 `/api` 요청이 자동으로 백엔드로 전달됩니다.

## 주요 기능

- 게시글 목록 조회
- 태그 필터링
- 페이징 처리
- 다크 모드 지원
- 반응형 디자인

## 프로젝트 구조

```
frontend/
├── src/
│   ├── api/          # API 클라이언트
│   ├── components/   # React 컴포넌트
│   ├── types/        # TypeScript 타입 정의
│   ├── styles/       # 스타일 파일
│   ├── App.tsx       # 메인 앱 컴포넌트
│   └── main.tsx      # 진입점
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

