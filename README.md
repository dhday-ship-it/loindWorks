# LOIND Workspace

Next.js(App Router) + PostgreSQL(Prisma) + Auth.js 기반 풀스택 프로젝트.

## 스택

- **Next.js 16** (TypeScript, App Router, Tailwind CSS)
- **Prisma 7** + **PostgreSQL** (Supabase, `@prisma/adapter-pg` 드라이버 어댑터 사용)
- **Auth.js (NextAuth v5)** — Credentials 로그인, JWT 세션

## 시작하기

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. Project Settings → Database → Connection string(URI)에서 접속 문자열 복사

### 2. 환경 변수 설정

`.env` 파일의 `DATABASE_URL`을 1번에서 복사한 값으로 교체하세요. `AUTH_SECRET`은 이미 랜덤 값이 채워져 있으며, 필요시 재생성하려면:

```bash
openssl rand -base64 32
```

### 3. 의존성 설치 및 DB 스키마 반영

```bash
npm install
npm run db:push   # 개발 중 스키마를 바로 DB에 반영 (마이그레이션 파일 없이)
# 또는
npm run db:migrate   # 마이그레이션 파일을 남기며 반영
```

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

## 주요 경로

| 경로 | 설명 |
| --- | --- |
| `/` | 브랜드 랜딩 히어로 |
| `/login` | LOIND Signal Hub — 로그인 / 신규 프로젝트 문의(Contact) |
| `/dashboard` | 로그인한 사용자 페이지 — `STAFF`/`SUPER_ADMIN`은 LOIND FLOW STATION(캘린더+업무+메모), `CLIENT`는 배정된 프로젝트 목록(My Workspace), 그 외는 기본 페이지 |
| `/dashboard/client/[id]` | `CLIENT` 전용 프로젝트 상세 — 진행 단계/진행률, 요청사항(열람+새 요청 작성), 결과물(자리만, 파일 업로드는 미구현), 히스토리 로그(열람 전용) |
| `/admin` | `SUPER_ADMIN`만 접근 가능한 관리자 페이지 (사용자/고객사/프로젝트 관리) |
| `/api/contact` | 프로젝트 문의 접수 (`ContactRequest` 테이블에 저장) |
| `/api/tasks`, `/api/tasks/[id]` | 업무 생성/조회, 상태 변경·삭제 (`STAFF`/`SUPER_ADMIN` 전용) |
| `/api/calendar-events`, `/api/calendar-events/[id]` | 팀 공유 캘린더 일정 (`STAFF`/`SUPER_ADMIN` 전용) |
| `/api/memos`, `/api/memos/[id]`, `/api/memo-folders` | 개인 메모/폴더, 본인 것만 조회 가능 (`STAFF`/`SUPER_ADMIN` 전용) |
| `/dashboard/projects` | 프로젝트 워크스테이션 — 단계 진행률, 요청사항(담당자별 상태+댓글), 히스토리 로그(통화/미팅/문자/이메일/메모+수정이력) |
| `/api/projects`, `/api/projects/[id]` | 프로젝트 목록/생성, 상세(멤버+요청사항+로그) 조회 |
| `/api/projects/[id]/requests`, `.../requests/[requestId]` | 요청사항 생성(`STAFF`/`SUPER_ADMIN`은 담당자 지정, `CLIENT`는 배정된 프로젝트에 한해 PM에게 자동 배정)/삭제 |
| `/api/client/projects` | 로그인한 `CLIENT`가 배정된 프로젝트 목록 조회 |
| `/api/projects/[id]/requests/[requestId]/assignees/[assigneeId]` | 담당자 상태 변경, 댓글 추가 |
| `/api/projects/[id]/logs`, `.../logs/[logId]` | 히스토리 로그 생성/수정(이력 자동 기록)/삭제 |
| `/api/staff` | 담당자 배정용 직원 목록 (`STAFF`/`SUPER_ADMIN` 전용) |
| `/api/auth/[...nextauth]` | Auth.js 인증 핸들러 |

## 권한(Role)

`User.role`은 4단계입니다: `SUPER_ADMIN` / `BRAND_ADMIN` / `STAFF` / `CLIENT` (기본값 `CLIENT`).

- **SUPER_ADMIN**: 계정 발급 및 시스템 전체 관리
- **BRAND_ADMIN**: (추후 확장 예정)
- **STAFF**: 실무자 — `/dashboard`(LOIND FLOW STATION)에서 팀 공유 캘린더, 개인 업무(대기/진행/컨펌/완료 + 프로젝트 태그), 개인 메모(폴더별)를 관리
- **CLIENT**: `/dashboard`(My Workspace)에서 배정된 프로젝트 목록·진행 상황을 열람하고, 프로젝트 상세에서 요청사항을 열람/작성해 담당 PM과 소통

새 계정은 `npm run db:studio`(Prisma Studio)에서 직접 만들거나 role을 변경하세요. 공개 회원가입 UI는 없고, 신규 고객은 `/login`의 **Contact** 폼으로 문의를 남기면 `ContactRequest` 테이블에 쌓입니다.

## 유용한 스크립트

```bash
npm run db:studio    # Prisma Studio (DB GUI)
npm run lint          # ESLint
npm run build          # 프로덕션 빌드
```
