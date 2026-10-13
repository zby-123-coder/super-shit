# 家教团队学习管理平台

三端协同（学生/家长/老师）+ Web 管理后台的教学管理平台。
技术栈：NestJS + Drizzle ORM + PostgreSQL + React(Vite)，**不依赖任何低代码平台**。

## 本地运行（三分钟）

前置：Node 18+、PostgreSQL 14+。

```bash
# 1. 建库
createdb jiajiao        # macOS: brew services start postgresql 先确保服务在跑

# 2. 装依赖
npm install

# 3. 建表（全量 16 张表，一条命令）
psql -d jiajiao -f scripts/full-migration.sql

# 4. 配置（.env.local 已按本机默认值配好，按需修改）
#    DATABASE_URL=postgres://beindignation@127.0.0.1:5432/jiajiao

# 5. 启动
npm run dev          # 后端 3000 + 前端 vite 8080（dev:client）
# 或构建后单端口运行：
npm run build:server && npm run build:client
npm start            # http://localhost:3000 完整应用
```

> 重新生成 schema（可选）：`npm run gen:db-schema`（drizzle-kit introspect）

## 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `DATABASE_URL` | 是 | PostgreSQL 连接串 |
| `PORT` / `SERVER_PORT` | 否 | 服务端口，默认 3000 |
| `CLIENT_BASE_PATH` | 否 | 前端构建期 API 前缀，同源部署用 `/` |
| `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` | 否 | AI 能力，未配置用内置规则版 |
| `WECHAT_APPID` / `WECHAT_SECRET` | 否 | 微信一键登录，未配置用账号密码 |

## 目录

```
server/            NestJS 后端
  common/ai/       AI 抽象层（规则版 + LLM 可切换）
  common/drizzle.ts 自持数据库接入
  modules/         业务模块（auth/account/course/task/progress/content/message/admin/ai/upload/report/wrong-question）
client/            React 前端（移动端三端视图 + /admin 管理后台）
miniapp/           微信小程序工程（与 Web 共用同一后端）
shared/            前后端共享 API 契约
scripts/           建表 SQL 与联调脚本（itest-*.sh）
uploads/           打卡图片（本地磁盘，部署时换 OSS）
```

## 联调脚本

```bash
bash scripts/itest-family.sh   # 家庭账户 + 越权 + 闭环联调
```
