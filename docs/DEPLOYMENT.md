# 部署指南

本文档描述华点（HuaDian）项目从开发到生产的完整部署流程。

## 1. 环境要求

| 项 | 版本 |
| --- | --- |
| Node.js | ≥ 20.9.0（推荐 22 LTS） |
| npm | ≥ 10 |
| 数据库 | PostgreSQL ≥ 14（本地开发推荐 Neon / Vercel Postgres 免费实例） |
| 内存 | ≥ 512 MB（小型部署）/ ≥ 1 GB（推荐） |

## 2. 环境变量

复制 `.env.example` 为 `.env`，按需填写：

```bash
cp .env.example .env
```

| 变量 | 说明 | 必填 |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串，如 `postgresql://user:pass@host:5432/huadian?schema=public` | ✅ |
| `AUTH_SECRET` | NextAuth JWT 签名密钥，用 `openssl rand -base64 32` 生成 | ✅ |
| `NEXT_PUBLIC_SITE_URL` | 站点完整 URL，如 `https://huadian.example.com` | ✅ |
| `AUTH_TRUST_HOST` | 反向代理后启用，设为 `true` | 生产必填 |
| `TEST_DATABASE_URL` | 集成测试专用独立空库连接串，留空则跳过集成测试 | 可选 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google 登录凭证 | 可选 |
| `WECHAT_CLIENT_ID` / `WECHAT_CLIENT_SECRET` | 微信登录凭证 | 可选 |

## 3. 本地开发

项目使用 PostgreSQL，本地无需安装数据库——推荐用 Neon 免费实例的远程连接串。

```bash
# 1. 在 https://neon.tech 注册并创建一个数据库，复制 connection string
# 2. 写入 .env 的 DATABASE_URL
npm install
npx prisma migrate dev --name init   # 首次初始化 schema（会创建迁移文件）
npm run seed                         # 写入种子数据
npm run dev                          # 启动开发服务器 http://localhost:3000
```

种子数据账号：

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 管理员 | admin@huadian.dev | admin123 |
| 普通用户 | alice@example.com | user12345 |
| 普通用户 | bob@example.com | user12345 |
| 商家 | merchant@goeast.example | user12345 |

> 也可用本地自建 PostgreSQL（如 Docker：`docker run -d -p 5432:5432 -e POSTGRES_DB=huadian -e POSTGRES_PASSWORD=pg postgres:16-alpine`），
> 连接串填 `postgresql://postgres:pg@localhost:5432/huadian?schema=public`。

## 4. 生产构建

```bash
npm install --omit=dev
npm run build
npm start
```

`npm start` 默认监听 3000 端口。可通过 `PORT=8080 npm start` 自定义。

## 5. 获取免费 PostgreSQL 实例

项目直接使用 PostgreSQL（无 SQLite 中间层），本地与生产共用同一套 schema 与适配器。获取免费 PG 实例的方式：

| 服务 | 免费额度 | 适用场景 |
| --- | --- | --- |
| [Neon](https://neon.tech) | 0.5GB 存储 / Serverless 按需计费 | 推荐：支持分支，本地/测试/生产可分库 |
| [Vercel Postgres](https://vercel.com/storage) | 256MB 存储（Hobby） | Vercel 部署时一站式开通 |
| [Supabase](https://supabase.com) | 500MB 存储 / 2 个项目 | 需要后台管理界面时 |
| 本地 Docker | 无限制 | 完全离线开发 |

> 关于 JSON 字段：`origins`/`destinations`/`serviceTypes`/`dimensions`/`images` 目前以 String 存储，
> `contains` 模糊查询在 PG 上同样可用，前端 `safeParseJson` 解析逻辑无需改动。
> 未来若需更精确的 JSON 路径查询，可将字段类型改为 Prisma `Json`（PG 原生 `jsonb`）。

## 6. 部署到 Vercel（推荐）

Vercel 是 Next.js 官方托管平台，零配置部署：

1. 将代码推送到 GitHub
2. 在 Vercel 控制台导入仓库
3. 配置环境变量（参见第 2 节），至少包含：
   - `DATABASE_URL`（Neon / Vercel Postgres 连接串）
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_SITE_URL`（Vercel 分配的域名）
   - `AUTH_TRUST_HOST=true`
4. 部署完成后在 Vercel 后台执行迁移与种子（Project → Settings → CLI，或本地连生产库执行）：

   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

> Vercel 函数有 10s/60s 超时限制；如需更长任务（如大规模爬虫），改用独立服务器或 Vercel Cron + 后台队列。
>
> Serverless 冷启动注意：`src/lib/prisma.ts` 已用 `globalThis` 缓存客户端与连接池，
> 同一函数实例复用时不会重复建连。

## 7. 部署到 VPS / Docker

### 7.1 Dockerfile（示例）

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
EXPOSE 3000
CMD ["npm", "start"]
```

### 7.2 docker-compose.yml（含 PostgreSQL）

```yaml
version: "3.9"
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: huadian
      POSTGRES_USER: huadian
      POSTGRES_PASSWORD: change-me
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  web:
    build: .
    environment:
      DATABASE_URL: postgresql://huadian:change-me@db:5432/huadian
      AUTH_SECRET: ${AUTH_SECRET}
      NEXT_PUBLIC_SITE_URL: https://huadian.example.com
      AUTH_TRUST_HOST: "true"
    depends_on:
      - db
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

启动：

```bash
docker compose up -d
docker compose exec web npx prisma migrate deploy
docker compose exec web npm run seed
```

### 7.3 Nginx 反向代理（示例）

```nginx
server {
    listen 80;
    server_name huadian.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

启用 HTTPS：

```bash
sudo certbot --nginx -d huadian.example.com
```

## 8. 性能优化建议

### 8.1 数据库

- 为高频查询字段添加索引（已在 schema 中预置 `@@index`）
- 列表页 `take` 限制在 50，避免单次拉取过多
- 公司详情页 `include` 报价 + 评价时通过 `take` 限制子查询规模

### 8.2 缓存

- 列表页可改为 ISR：`export const revalidate = 300`（5 分钟刷新一次）
- 详情页因含个性化内容（登录态、商家回复）建议保持 SSR
- 静态资源由 Next.js 自动通过 `_next/static` 长期缓存

### 8.3 图片

- 上传图片走对象存储（S3 / R2 / 阿里云 OSS）后写入图片 URL
- `next/image` 自动按设备分辨率生成响应式图片
- 已配置 AVIF / WebP 优先

### 8.4 包体积

- `lucide-react` 已通过 `optimizePackageImports` 按需引入
- 服务端组件优先，客户端组件仅用于交互（表单、投票按钮等）

## 9. 监控与日志

- Vercel：在 Dashboard 查看 Functions / Edge 日志
- VPS：建议接入 PM2 + 日志切割，或 Docker logs
- 错误监控：可接入 Sentry（`@sentry/nextjs`）
- 性能监控：Vercel Analytics 或 Web Vitals 自定义上报

## 10. 定时任务

### 10.1 网络评价抓取

`scripts/crawl-reviews.ts` 提供占位实现，生产部署时：

1. 实现真实抓取逻辑（参见脚本注释）
2. 配置定时任务：

   **Vercel Cron**（`vercel.json`）：
   ```json
   {
     "crons": [
       { "path": "/api/cron/crawl", "schedule": "0 3 * * *" }
     ]
   }
   ```

   **Linux crontab**：
   ```cron
   0 3 * * * cd /app && npm run crawl:reviews >> /var/log/huadian-crawl.log 2>&1
   ```

### 10.2 优惠码过期检查

可定期扫描 `validUntil < now` 的码并标记为 `EXPIRED`。
