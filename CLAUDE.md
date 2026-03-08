# CLAUDE.md — FuviAI CRM

> **Project memory file** — Đọc file này trước khi làm bất kỳ task nào.
> Cập nhật file này khi có thay đổi quan trọng về kiến trúc hoặc quyết định kỹ thuật.

---

## 🏢 Tổng quan dự án

| | |
|---|---|
| **Tên sản phẩm** | FuviAI CRM |
| **Domain** | crm.fuviai.com |
| **Mô tả** | Nền tảng CRM thế hệ mới cho doanh nghiệp Việt Nam, tích hợp AI để tự động hóa bán hàng và chăm sóc khách hàng |
| **Thị trường** | Doanh nghiệp Việt Nam (SME + Enterprise) |
| **Ngôn ngữ UI** | 100% Tiếng Việt |
| **Repo** | github.com/[your-org]/fuviai-crm |

---

## 🏗️ Kiến trúc hệ thống

### Monorepo structure (Turborepo + pnpm)

```
fuviai-crm/
├── apps/
│   ├── web/          → Next.js 14 (App Router) — frontend chính
│   └── api/          → NestJS — REST API backend
├── packages/
│   ├── ui/           → Shared React components (shadcn/ui)
│   ├── db/           → Prisma schema + client + migrations
│   ├── ai/           → AI service wrappers (OpenAI / Anthropic)
│   └── config/       → Shared ESLint, TypeScript, constants
├── infrastructure/
│   ├── docker-compose.yml       → Local dev
│   └── docker-compose.prod.yml → Production
└── CLAUDE.md
```

### Request flow

```
Browser → Next.js (SSR/CSR) → NestJS API → PostgreSQL
                                          → Redis (cache/queue)
                                          → OpenAI API (AI features)
                                          → Zalo OA API
                                          → Email/SMS gateways
```

---

## ⚙️ Tech Stack

### Frontend (`apps/web`)
| Layer | Tech |
|---|---|
| Framework | Next.js 14 — App Router, Server Components |
| Language | TypeScript (strict mode) |
| Styling | TailwindCSS + shadcn/ui |
| State | Zustand (client state) + TanStack Query (server state) |
| Forms | react-hook-form + zod |
| Tables | @tanstack/react-table |
| Drag & Drop | @dnd-kit/core |
| Charts | Recharts |
| Date | date-fns |

### Backend (`apps/api`)
| Layer | Tech |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript (strict mode) |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Queue | BullMQ |
| Auth | JWT (access 15m + refresh 7d httpOnly cookie) |
| Validation | class-validator + class-transformer |
| Docs | Swagger / OpenAPI |

### AI & Integrations
| Service | Purpose |
|---|---|
| OpenAI GPT-4o | FuviBot, Lead Scoring, Email Writer |
| Zalo OA API | Nhắn tin khách hàng |
| AWS SES / SendGrid | Email marketing |
| Stripe + VNPay | Thanh toán subscription |

---

## 🗃️ Database — Prisma Schema

### Multi-tenancy rules
- **QUAN TRỌNG**: Mọi table business đều có `organizationId String`
- Mọi query PHẢI có `where: { organizationId: ctx.organizationId }`
- Không bao giờ query cross-tenant

### Soft delete
- Dùng `deletedAt DateTime?` — KHÔNG dùng hard delete
- Mọi query PHẢI có `where: { deletedAt: null }`

### Audit fields (bắt buộc trên mọi table)
```prisma
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
deletedAt   DateTime?
createdById String?
updatedById String?
```

### Core models
```
Organization  → tenant root, có plan (STARTER/PRO/BUSINESS/ENTERPRISE)
User          → thuộc 1 Organization, role: OWNER/ADMIN/MEMBER/VIEWER
Contact       → khách hàng, có aiScore, customFields JSON, status
Deal          → cơ hội bán hàng, gắn với Contact + PipelineStage
Pipeline      → quy trình bán hàng, có nhiều PipelineStage
PipelineStage → giai đoạn trong pipeline (Lead→Prospect→Proposal→Won/Lost)
Activity      → log hành động (CALL/EMAIL/MEETING/TASK), gắn Contact/Deal
Note          → ghi chú tự do, gắn Contact/Deal
Tag           → nhãn, dùng chung cho Contact và Deal
Conversation  → thread nhắn tin (Zalo/Email/SMS)
Message       → tin nhắn trong Conversation
WorkflowAutomation → quy trình tự động
```

---

## 📁 Conventions — BẮT BUỘC tuân thủ

### Naming
```
Variables/Functions : camelCase       → getUserById, contactList
Classes/Types       : PascalCase      → ContactService, CreateContactDto
Files (component)   : PascalCase.tsx  → ContactCard.tsx
Files (service/util): kebab-case.ts   → contact.service.ts
Database columns    : snake_case      → organization_id, created_at
API endpoints       : kebab-case      → /api/v1/contact-tags
Env variables       : UPPER_SNAKE     → DATABASE_URL, OPENAI_API_KEY
```

### API Response format (LUÔN dùng format này)
```typescript
// Success
{ data: T, meta?: { total, page, limit } }

// Error
{ error: { code: string, message: string, details?: any } }

// HTTP Status codes:
// 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized,
// 403 Forbidden, 404 Not Found, 422 Unprocessable, 500 Server Error
```

### File structure trong NestJS module
```
modules/contacts/
├── contacts.module.ts
├── contacts.controller.ts   → HTTP layer, validation
├── contacts.service.ts      → Business logic
├── contacts.repository.ts   → Database queries (Prisma)
├── dto/
│   ├── create-contact.dto.ts
│   ├── update-contact.dto.ts
│   └── query-contact.dto.ts
├── entities/
│   └── contact.entity.ts
└── contacts.service.spec.ts → Unit tests
```

### Comments
- Comment bằng **tiếng Việt** khi logic phức tạp hoặc không tự giải thích được
- Dùng `// TODO:`, `// FIXME:`, `// HACK:` cho các vấn đề cần giải quyết sau
- Không comment code thừa (xóa thay vì comment out)

---

## 🔐 Security — KHÔNG BAO GIỜ vi phạm

1. **Không hard-code secret** — Dùng biến môi trường, đọc từ `.env`
2. **Validate mọi input** — Dùng class-validator DTOs, không trust client data
3. **Check organizationId** — Mọi query phải filter theo tenant của user hiện tại
4. **Sanitize output** — Không trả về passwordHash, refreshToken trong response
5. **Rate limiting** — Áp dụng cho mọi public endpoint
6. **SQL Injection** — Luôn dùng Prisma parameterized queries, không string concat

---

## 🧪 Testing

```bash
# Unit tests (Vitest)
pnpm test                   # Run all
pnpm test:watch             # Watch mode
pnpm test:coverage          # Coverage report (target >= 80%)

# E2E tests (Playwright)
pnpm test:e2e

# API tests (trong file .http hoặc Supertest)
pnpm test:api
```

### Rule: Mỗi service file PHẢI có `.spec.ts` tương ứng
- Test happy path + error cases + edge cases
- Mock external dependencies (Prisma, OpenAI, Zalo API)
- Coverage target: 80% cho services, 60% cho controllers

---

## 🚀 Development Workflow

### Khởi động local dev
```bash
# 1. Start services
docker-compose up -d            # PostgreSQL + Redis + MailHog

# 2. Database
pnpm db:migrate                 # Apply migrations
pnpm db:seed                    # Seed test data (optional)

# 3. Start all apps
pnpm dev                        # Turborepo chạy tất cả đồng thời

# Apps:
# web → http://localhost:3000
# api → http://localhost:4000
# api docs → http://localhost:4000/api/docs
# MailHog → http://localhost:8025
# Prisma Studio → pnpm db:studio (port 5555)
```

### Git workflow
```bash
main        → Production (crm.fuviai.com)
develop     → Staging
feature/*   → Feature branches (ví dụ: feature/contact-import)
fix/*       → Bug fixes
```

### Commit message format (Conventional Commits)
```
feat: thêm tính năng import contacts từ CSV
fix: sửa lỗi pagination trả về sai total
refactor: tách contact service thành repository pattern
test: thêm unit test cho AI lead scoring
docs: cập nhật API docs cho /contacts endpoint
```

---

## 🗺️ Sprint Roadmap — Trạng thái hiện tại

| Sprint | Tên | Trạng thái |
|--------|-----|-----------|
| S1 | Auth & Multi-tenancy | ✅ Hoàn thành |
| S2 | Contact Management | ✅ Hoàn thành |
| S3 | Pipeline & Deals | ✅ Hoàn thành |
| S4 | Activity & Calendar | ✅ Hoàn thành |
| S5 | FuviBot AI Assistant | ✅ Hoàn thành |
| S6 | Email Marketing | ✅ Hoàn thành |
| S7 | Zalo OA Integration | ✅ Hoàn thành |
| S8 | Automation Engine | ✅ Hoàn thành |
| S9 | Dashboard & Reports | ✅ Hoàn thành |
| S10 | Team & Permissions | ✅ Hoàn thành |
| S11 | Billing & Subscription | ✅ Hoàn thành |
| S12 | Mobile App | ✅ Hoàn thành |
| S13 | Notifications & Real-time | ✅ Hoàn thành |
| S14 | Global Search + Profile & Settings | ✅ Hoàn thành |
| S15 | Audit Logs | ✅ Hoàn thành |
| S16 | API Keys & Webhooks | ✅ Hoàn thành |
| S17 | Background Jobs, Caching & Infrastructure | ✅ Hoàn thành |
| S18 | Tests, CI/CD & Production Ready | ✅ Hoàn thành |

> **Cập nhật trạng thái sprint** khi hoàn thành: ✅ Hoàn thành / 🔄 Đang làm / ⬜ Chưa bắt đầu

---

## 📋 Decisions Log — Các quyết định kỹ thuật đã chốt

| Ngày | Quyết định | Lý do |
|------|-----------|-------|
| 2026-03 | Dùng Turborepo monorepo | Chia sẻ code giữa web/api/mobile dễ dàng |
| 2026-03 | Dùng NestJS thay vì Express | TypeScript-first, DI pattern, dễ test |
| 2026-03 | Multi-tenancy bằng organizationId | Đơn giản hơn schema-per-tenant, dễ migrate |
| 2026-03 | Soft delete thay vì hard delete | Có thể khôi phục, audit trail đầy đủ |
| 2026-03 | GPT-4o cho AI features | Tiếng Việt tốt nhất hiện tại |

> **Thêm vào đây** khi team quyết định thay đổi tech stack hoặc architecture

---

## ⚠️ Known Issues & Technical Debt

> Ghi lại các vấn đề biết trước để không fix đi fix lại

*(Trống — sẽ cập nhật khi có)*

---

- **Figma Design**: *(link khi có)*
- **Staging**: https://staging.crm.fuviai.com
- **Production**: https://crm.fuviai.com
- **API Docs**: https://crm.fuviai.com/api/docs
- **Linear/Jira**: *(link project management)*
- **Zalo OA Dashboard**: *(link khi có)*
- **Stripe Dashboard**: *(link khi có)*

---

*Lần cập nhật cuối: 2026-03-07 | Người cập nhật: Claude Code | Sprint 18 hoàn thành — TẤT CẢ SPRINTS HOÀN THÀNH ✅*
