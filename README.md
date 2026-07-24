# 华德福 HuaDeFu — 在德华人生活指南

> 面向在德华人的一站式生活信息聚合与点评平台：中德转运公司报价与评价、邀请码/打折码分享、德国电话套餐比价。

文档：[PRD](./PRD.md) · [部署指南](./docs/DEPLOYMENT.md)

## ✨ 核心功能

### 🚚 中德转运公司
- 公司列表与多维度筛选（服务类型、起运地、目的地、评分）
- 公司详情：报价表、用户评价、网络聚合评价
- 商家自助入驻：申请审核 → 创建公司 → 维护报价 → 回复评价
- 评分加权：用户评分（按信用加权）× 0.7 + 网络评价 × 0.3

### 📱 电话套餐比价
- Telekom / Vodafone / O2 / 1&1 / congstar 等运营商套餐
- 月均资费计算（考虑促销期）
- 按流量、合约期、价格筛选
- 用户真实评价与套餐对比

### 🎫 优惠码 / 邀请码 / 返利码
- 三种类型：邀请码、打折码、返利码
- 分类：电商、流媒体、工具、转运、通讯
- 用户投票机制（👍 可用 / 👎 失效）自动标记过期
- 反作弊：同平台每日最多 3 条

### ⭐ 用户评价系统
- 多维度评分（价格 / 速度 / 包装 / 服务 / 丢件 / 清关）
- 信用分级（资深 / 活跃 / 普通 / 新人）影响评分权重
- 反刷分：冷却期、日上限、信用分惩罚
- 商家回复机制

### 🛡 运营后台
- 评价审核（通过 / 拒绝 / 删除）
- 商家入驻申请审核
- 用户管理（角色变更、信用分调整、封禁）
- 优惠码管理（状态切换、彻底删除）
- 数据统计概览

### 🔍 SEO 优化
- 动态 sitemap.xml（含公司/套餐详情页）
- robots.txt（屏蔽后台与 API 路径）
- JSON-LD 结构化数据（Organization / Product / AggregateRating）
- Open Graph / Twitter Card 元数据
- PWA manifest

## 🛠 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 16（App Router, RSC） |
| 语言 | TypeScript 5（strict） |
| 样式 | Tailwind CSS v4 |
| UI 组件 | shadcn/ui 风格自实现 + Radix Slot |
| 数据库 | Prisma 7 + PostgreSQL（本地用 Neon/Vercel Postgres 远程串） |
| 鉴权 | NextAuth v5 beta（Credentials / Google / WeChat） |
| 校验 | Zod 4 + React Hook Form |
| 测试 | Vitest 4（单元 + 集成） |
| 字体 | 系统字体栈 |

## 🚀 快速开始

### 前置要求

- Node.js ≥ 20.9
- npm ≥ 10
- 一个 PostgreSQL 数据库（推荐 Neon 免费实例，注册即用，无需本地装 PG）

### 安装与启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填写：
#   DATABASE_URL  —— Neon/Vercel Postgres/本地 PG 的连接串
#   AUTH_SECRET   —— 用 `openssl rand -base64 32` 生成

# 3. 初始化数据库 schema
npx prisma migrate dev --name init

# 4. 写入种子数据
npm run seed

# 5. 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可访问。

### 测试账号

| 角色 | 邮箱 | 密码 | 可访问 |
| --- | --- | --- | --- |
| 管理员 | admin@huadefu.org | admin123 | /admin |
| 普通用户 | alice@example.com | user12345 | 发布评价/优惠码 |
| 普通用户 | bob@example.com | user12345 | 发布评价/优惠码 |
| 商家 | merchant@goeast.example | user12345 | /merchant |

## 📜 常用脚本

```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run start        # 启动生产服务
npm run lint         # ESLint 检查
npm run typecheck    # TypeScript 类型检查
npm run test         # 运行测试套件（vitest run）
npm run test:watch   # 监听模式测试
npm run seed         # 写入种子数据
npm run crawl:reviews # 网络评价爬虫占位（未实际抓取）
```

## 🧪 测试

测试基于 Vitest，共 4 个测试文件：

| 文件 | 覆盖范围 | 需要数据库 |
| --- | --- | --- |
| `tests/utils.test.ts` | 工具函数：cn / slugify / formatRating / relativeTime / formatEuro / safeParseJson / creditLevel | 否 |
| `tests/validations.test.ts` | Zod 校验：注册/登录/公司/报价/优惠码/套餐/评价 | 否 |
| `tests/rating.test.ts` | 评分重算：用户加权 / 聚合加权 / 综合 0.7:0.3 | 否（mock prisma） |
| `tests/api.integration.test.ts` | API 集成：公司列表/详情、优惠码列表、套餐列表 | 是（PostgreSQL，未设 `TEST_DATABASE_URL` 自动跳过） |

```bash
# 仅单元测试（无需数据库）
npm run test

# 含集成测试（需提供一个独立空库）
TEST_DATABASE_URL="postgresql://..." npm run test
```

## 📁 项目结构

```
huadefu/
├── prisma/
│   ├── schema.prisma        # 数据库 schema
│   ├── migrations/          # 迁移文件
│   └── seed.ts              # 种子数据脚本
├── scripts/
│   └── crawl-reviews.ts     # 网络评价爬虫占位
├── src/
│   ├── app/
│   │   ├── (公开页面)
│   │   │   ├── page.tsx              # 首页
│   │   │   ├── companies/            # 转运公司列表+详情
│   │   │   ├── phone-plans/          # 电话套餐列表+详情
│   │   │   ├── codes/                # 优惠码列表+发布
│   │   │   ├── reviews/              # 发布评价
│   │   │   └── search/               # 全站搜索
│   │   ├── (用户)
│   │   │   ├── login/ register/ me/
│   │   ├── (商家)
│   │   │   └── merchant/             # 商家工作台
│   │   ├── (运营)
│   │   │   └── admin/                # 管理后台
│   │   ├── api/                      # RESTful API
│   │   ├── layout.tsx                # 根布局
│   │   ├── robots.ts                 # SEO: robots.txt
│   │   ├── sitemap.ts                # SEO: sitemap.xml
│   │   └── manifest.ts               # PWA manifest
│   ├── components/
│   │   ├── ui/                       # 基础组件（Button/Card/Badge/Input/...）
│   │   ├── layout/                   # Navbar / Footer
│   │   ├── companies/                # 公司卡片/表单/报价表
│   │   ├── reviews/                  # 评价表单/列表/回复
│   │   ├── codes/                    # 优惠码卡片/表单
│   │   └── admin/                    # 后台审核操作组件
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma 客户端（PrismaPg 适配器 + 连接池复用）
│   │   ├── auth.ts                   # NextAuth 配置
│   │   ├── validations.ts            # Zod schemas
│   │   ├── rating.ts                 # 评分重算算法
│   │   └── utils.ts                  # 工具函数
│   └── generated/                    # Prisma 生成代码（勿手动修改）
├── tests/                            # 测试
├── docs/DEPLOYMENT.md                # 部署指南
├── PRD.md                            # 产品需求文档
├── .env.example                      # 环境变量模板
└── next.config.ts                    # Next.js 配置（安全头/缓存/分包）
```

## 🗄 数据模型

核心实体：

- **User** — 用户（普通/商家/管理员，含信用分）
- **MerchantProfile** — 商家入驻申请
- **Company** — 转运公司
- **CompanyQuote** — 公司报价（渠道）
- **Review** — 用户评价（含多维度评分）
- **AggregatedReview** — 网络聚合评价
- **Code** — 优惠码/邀请码/返利码
- **PhonePlan** — 电话套餐

详见 [prisma/schema.prisma](./prisma/schema.prisma)。

## 🚢 部署

详见 [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)，涵盖：

- 环境变量配置
- 本地开发 → 生产构建
- SQLite → PostgreSQL 切换
- Vercel 部署
- Docker / docker-compose 部署
- Nginx 反向代理与 HTTPS
- 性能优化建议
- 定时任务（爬虫）

## 📐 评分算法

公司综合评分 = 用户评分 × 0.7 + 网络评价分 × 0.3

- **用户评分**：按发布者信用等级加权
  - 资深（≥81）权重 2.0
  - 活跃（51-80）权重 1.5
  - 普通（21-50）权重 1.0
  - 新人（<21）权重 0.5
- **网络评价分**：正面=5，中性=3，负面=1，按点赞数加权
- 评价数 < 5 时页面标注「样本不足」
- 套餐无网络评价，仅用用户加权评分

实现：[src/lib/rating.ts](./src/lib/rating.ts)

## 🔒 反作弊机制

- 评价冷却期 + 每日上限
- 信用分系统：违规评价被删除扣 5 分，封禁可清零
- 优惠码：同平台每日最多 3 条
- 优惠码投票：用户标记失效后自动计入失效率
- 商家入驻需人工审核
- 管理员可软封禁（信用分清零，限制发布）

## 📄 License

私有项目，未开源。
