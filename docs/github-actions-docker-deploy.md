# GitHub Actions + Docker 部署全流程记录

> 项目：pnpm monorepo + Next.js (apps/sun)  
> 服务器：腾讯云 81.70.148.10（中国大陆）  
> 镜像仓库：Docker Hub  
> 时间：2026-02

---

## 整体架构

```
本地 git push
    ↓
GitHub Actions (ubuntu-latest，境外机器)
    ├─ docker build  ← 读取 GitHub Secrets 作为 build-arg
    ├─ docker push   → Docker Hub
    └─ SSH 进服务器
           ├─ docker pull  ← 走腾讯云内网镜像加速
           ├─ docker stop / rm 旧容器
           └─ docker run 新容器（端口 3000）
```

---

## 第一步：准备 GitHub Secrets

在仓库 **Settings → Secrets and variables → Actions** 添加：

| Secret 名称 | 说明 |
|---|---|
| `SSH_PRIVATE_KEY` | 服务器 SSH 私钥（完整内容） |
| `SERVER_HOST` | 服务器 IP，如 `81.70.148.10` |
| `DOCKER_USERNAME` | Docker Hub **用户名**（不是邮箱！） |
| `DOCKER_PASSWORD` | Docker Hub 密码或 Access Token |
| `NEXT_PUBLIC_TDT_KEY` | 天地图 API Key |
| `NEXT_PUBLIC_AMAP_KEY` | 高德地图 API Key |
| `NEXT_PUBLIC_BAIDU_TONGJI_ID` | 百度统计 ID |

> ⚠️ `DOCKER_USERNAME` 必须填账号名（如 `jianghr`），不能填邮箱。
> 邮箱里有 `@` 符号，Docker 镜像引用不支持，会报 `invalid reference format`。

---

## 第二步：next.config.js 添加 standalone 模式

```js
const nextConfig = {
  output: 'standalone',   // ← 新增，生成自包含的 server.js，大幅减小镜像体积
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
}
```

**原因**：`standalone` 模式让 `next build` 输出一个不依赖 `node_modules` 的 `server.js`，
Docker 最终镜像不需要打包源码和依赖，体积从数 GB 降到约 80MB。

---

## 第三步：Dockerfile

```dockerfile
# ---- builder stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* 变量必须在构建时注入，运行时设置无效
ARG NEXT_PUBLIC_TDT_KEY
ARG NEXT_PUBLIC_AMAP_KEY
ARG NEXT_PUBLIC_BAIDU_TONGJI_ID
ENV NEXT_PUBLIC_TDT_KEY=$NEXT_PUBLIC_TDT_KEY
ENV NEXT_PUBLIC_AMAP_KEY=$NEXT_PUBLIC_AMAP_KEY
ENV NEXT_PUBLIC_BAIDU_TONGJI_ID=$NEXT_PUBLIC_BAIDU_TONGJI_ID

RUN corepack enable && corepack prepare pnpm@9.6.0 --activate

# 先复制 package manifests，充分利用 Docker 层缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/sun/package.json ./apps/sun/package.json
# postinstall 会执行 copy-cesium.js，scripts 目录必须在 install 前存在
COPY apps/sun/scripts/ ./apps/sun/scripts/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter sun run build

# ---- runner stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/apps/sun/.next/standalone ./
COPY --from=builder /app/apps/sun/.next/static ./apps/sun/.next/static
COPY --from=builder /app/apps/sun/public       ./apps/sun/public

EXPOSE 3000
CMD ["node", "apps/sun/server.js"]
```

---

## 第四步：GitHub Actions workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Sun App

on:
  push:
    branches:
      - main

jobs:
  build-and-push:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Docker 镜像名必须全小写，且不能是邮箱格式
      - name: Compute image name
        id: img
        run: |
          RAW='${{ secrets.DOCKER_USERNAME }}'
          NAME=$(printf '%s' "${RAW%%@*}" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
          echo "value=${NAME}/sun" >> $GITHUB_OUTPUT

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract image metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ steps.img.outputs.value }}
          tags: |
            type=sha,prefix=sha-,format=short
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: |
            NEXT_PUBLIC_TDT_KEY=${{ secrets.NEXT_PUBLIC_TDT_KEY }}
            NEXT_PUBLIC_AMAP_KEY=${{ secrets.NEXT_PUBLIC_AMAP_KEY }}
            NEXT_PUBLIC_BAIDU_TONGJI_ID=${{ secrets.NEXT_PUBLIC_BAIDU_TONGJI_ID }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to Server
    runs-on: ubuntu-latest
    needs: build-and-push
    steps:
      - name: Compute image name
        id: img
        run: |
          RAW='${{ secrets.DOCKER_USERNAME }}'
          NAME=$(printf '%s' "${RAW%%@*}" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
          echo "value=${NAME}/sun" >> $GITHUB_OUTPUT

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            docker pull ${{ steps.img.outputs.value }}:latest
            docker stop sun 2>/dev/null || true
            docker rm   sun 2>/dev/null || true
            docker run -d \
              --name sun \
              --restart unless-stopped \
              -p 3000:3000 \
              ${{ steps.img.outputs.value }}:latest
            docker image prune -f
```

---

## 第五步：服务器配置 Docker 镜像加速

腾讯云服务器无法直连 Docker Hub，需要配置国内镜像源：

```bash
# SSH 进服务器
ssh root@81.70.148.10

# 写入镜像加速配置
cat > /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.m.daocloud.io",
    "https://docker.nju.edu.cn"
  ]
}
EOF

# 重启 Docker
systemctl daemon-reload && systemctl restart docker

# 验证
docker pull hello-world
```

> `mirror.ccs.tencentyun.com` 是腾讯云内网镜像，走内网流量，速度最快。

---

## 踩坑记录

### 坑 1：Docker 镜像名 invalid reference format

**现象**：`ERROR: invalid tag "***/sun:latest": invalid reference format`

**原因**：`DOCKER_USERNAME` secret 填的是邮箱（含 `@`），Docker 镜像名不支持 `@`。

**修复**：填 Docker Hub 账号名，或用 `${RAW%%@*}` 截取 `@` 前面的部分。

---

### 坑 2：pnpm lockfile 不同步

**现象**：`ERR_PNPM_OUTDATED_LOCKFILE: pnpm-lock.yaml is not up to date`

**原因**：`apps/sun/package.json` 删除了 `@tailwindcss/typography`，但没有重新运行 `pnpm install` 更新锁文件。

**修复**：本地运行 `pnpm install --no-frozen-lockfile`，提交更新后的 `pnpm-lock.yaml`。

---

### 坑 3：postinstall 找不到 copy-cesium.js

**现象**：`Error: Cannot find module '/app/apps/sun/scripts/copy-cesium.js'`

**原因**：Dockerfile 为了利用层缓存，先只 COPY `package.json` 就执行 `pnpm install`。
但 `package.json` 里有 `postinstall: node scripts/copy-cesium.js`，安装完包后 pnpm 立即执行这个脚本，此时 `scripts/` 目录还没被 COPY 进来。

**修复**：在 `pnpm install` 之前先 `COPY apps/sun/scripts/ ./apps/sun/scripts/`。

---

### 坑 4：Cesium Viewer 构造函数 imageryProvider 已移除

**现象**：`Type error: 'imageryProvider' does not exist in type 'ConstructorOptions'`

**原因**：Cesium 1.104+ 移除了 `Viewer` 构造函数的 `imageryProvider` 参数。

**修复**：改为 `baseLayer: false`（效果相同，禁用默认底图）。

---

### 坑 5：TypeScript 闭包类型收窄失效

**现象**：`Argument of type 'string | null' is not assignable to parameter of type 'string'`

**原因**：`useEffect` 回调里的 `if (!nodeIdFromUrl) return` 能收窄类型，
但进入 `async function loadNode()` 闭包后 TypeScript 不再维持收窄。

**修复**：在 guard 之后把值存到局部常量：
```typescript
if (!nodeIdFromUrl) return
const nodeId: string = nodeIdFromUrl  // 类型固定为 string，闭包内安全引用
```

---

### 坑 6：中国大陆服务器无法访问 Docker Hub

**现象**：`net/http: request canceled while waiting for connection (Client.Timeout exceeded)`

**原因**：腾讯云大陆服务器直连 `registry-1.docker.io` 超时。

**修复**：在服务器配置 Docker 镜像加速（腾讯云内网源 + 国内公共源），见第五步。

---

### 坑 7：天地图 CORS / 418 错误

**现象**：`Access-Control-Allow-Origin` 缺失，`tk=` 为空，返回 418

**原因**：`NEXT_PUBLIC_TDT_KEY` 等变量是 Next.js 客户端变量，在 `next build` 时被硬编码进 JS bundle。
Docker 运行时设置环境变量对已构建的前端代码无效。

**修复**：通过 Docker `ARG` → `ENV` 在构建阶段注入，workflow 用 `build-args` 传递：
```dockerfile
ARG NEXT_PUBLIC_TDT_KEY
ENV NEXT_PUBLIC_TDT_KEY=$NEXT_PUBLIC_TDT_KEY
```
```yaml
build-args: |
  NEXT_PUBLIC_TDT_KEY=${{ secrets.NEXT_PUBLIC_TDT_KEY }}
```

---

## 关键知识点总结

| 知识点 | 说明 |
|---|---|
| `output: 'standalone'` | Next.js 生产部署必备，大幅减小镜像 |
| Docker 层缓存 | 先 COPY 变化少的文件（package.json），再 COPY 源码 |
| `NEXT_PUBLIC_*` 变量 | 构建时注入，运行时无效 |
| pnpm monorepo Docker | 不能跨 stage 复制 node_modules（hard link 会断） |
| Docker 镜像名 | 必须全小写，不能含 `@` 等特殊字符 |
| 腾讯云 Docker 加速 | `mirror.ccs.tencentyun.com` 走内网，最快 |
