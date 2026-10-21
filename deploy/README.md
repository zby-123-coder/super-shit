# CloudBase 部署指南（家教平台）

> 物料已全部备好：`Dockerfile` + `.env.production.example` + `deploy/demo-data.sql`（23 张表含演示数据）。
> 本地已构建验证通过（`npm run build`）。唯一待办：在 IDE 侧连接 CloudBase 账号后按本文执行。

## 一、前置（一次性）

1. **连接 CloudBase**：IDE 集成面板 → 连接 CloudBase（需腾讯云账号授权）
2. **新建环境**：CloudBase 控制台 → 新建环境（建议：华东/华南，按你所在区域）
3. **开通 PostgreSQL**：控制台 → 数据库 → PostgreSQL → 新建实例（免费额度够体验）
4. **导入数据**：数据库管理页 → 执行 `deploy/demo-data.sql`（23 张表 + 演示账号/学生数据/知识库）
   - 演示账号：`admin001 / 123456`（管理员），其余演示账号在 `app_profile` / `auth_credential` 表内可查

## 二、部署服务（云托管 CBR）

控制台 → 云托管 → 新建服务：

| 配置项 | 值 |
|---|---|
| 服务名称 | jiajiao |
| 部署方式 | 本地上传代码包 / 关联仓库 |
| 端口 | 3000 |
| Dockerfile | 用仓库自带 `Dockerfile`（多阶段构建，单容器同时服务 API + 前端） |
| 环境变量 | 按 `.env.production.example` 逐项填入（DATABASE_URL 必填，AI_* 三行建议填上） |

## 三、发布与验证

1. 部署完成后，云托管分配默认域名（如 `https://jiajiao-xxxxx.sh.run.tcloudbase.com`）
2. 验收清单：
   - [ ] 打开域名能看到登录页，`admin001 / 123456` 能登录
   - [ ] 管理后台能看到演示学生（林小满等）
   - [ ] 触发一次「学情诊断」→ 看耗时 >1s 即真实 LLM（规则版是毫秒级）
   - [ ] 学生端开一次「AI 陪练」→ 多轮对话有上下文记忆
   - [ ] 知识库：`/api/kb/search?keyword=平行志愿` 有结果

## 四、已知边界（诚实说明）

- **图片上传**：打卡图片落容器本地盘，服务重启/重新部署会丢 → 体验可接受；生产接 COS（`oss-storage.provider.ts` 已留口子，改环境变量即可切换）
- **数据时效**：`education_kb` 调研于 2026-10，政策逐年微调，正式使用前人工核实
- **登录限流**：本地版按内存计数，多实例部署时按单实例计（生产需 Redis，见开发日志已知问题 #2）
