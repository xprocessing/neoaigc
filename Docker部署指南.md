# NeoAI GC - Docker部署指南

## 目录

1. [快速开始](#快速开始)
2. [环境要求](#环境要求)
3. [配置说明](#配置说明)
4. [部署步骤](#部署步骤)
5. [常用命令](#常用命令)
6. [运维管理](#运维管理)
7. [故障排查](#故障排查)
8. [生产环境优化](#生产环境优化)

---

## 快速开始

### 一键部署（推荐）

```bash
# 1. 克隆项目
git clone <repository-url>
cd neoaigc

# 2. 修改环境变量
nano .env

# 3. 启动所有服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f
```

### 访问应用

- **前端**: http://localhost
- **后端API**: http://localhost:8080/api
- **MySQL**: localhost:3306

---

## 环境要求

### 软件要求

| 软件 | 版本要求 | 用途 |
|------|---------|------|
| Docker | 20.10+ | 容器运行时 |
| Docker Compose | 2.0+ | 容器编排 |
| 操作系统 | Linux/Windows/macOS | 宿主系统 |

### 硬件要求

| 资源 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 2核 | 4核+ |
| 内存 | 2GB | 4GB+ |
| 硬盘 | 20GB | 50GB+ |
| 网络 | 10Mbps | 100Mbps+ |

### 安装Docker

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo apt-get install docker-compose-plugin
```

**Linux (CentOS)**:
```bash
yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl start docker
systemctl enable docker
```

**Windows**:
下载并安装 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

**macOS**:
下载并安装 [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)

---

## 配置说明

### 环境变量配置 (.env)

项目根目录下的`.env`文件包含所有环境变量，请根据实际情况修改：

#### 数据库配置
```bash
MYSQL_ROOT_PASSWORD=your_strong_root_password_here  # MySQL root密码
MYSQL_DATABASE=neoaigc                          # 数据库名
MYSQL_USER=neoaigc                              # 应用用户
MYSQL_PASSWORD=your_strong_password_here           # 应用用户密码
MYSQL_PORT=3306                                 # MySQL端口
```

#### 后端配置
```bash
SPRING_PROFILES_ACTIVE=prod    # Spring环境（dev/test/prod）
BACKEND_PORT=8080           # 后端服务端口
```

#### 腾讯混元AI配置
```bash
# 在腾讯云控制台获取：https://console.cloud.tencent.com/cam/capi
HUNYUAN_SECRET_ID=your_secret_id
HUNYUAN_SECRET_KEY=your_secret_key
HUNYUAN_REGION=ap-guangzhou
```

#### 微信登录配置
```bash
# 在微信公众平台获取：https://mp.weixin.qq.com
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
WECHAT_REDIRECT_URI=http://your-domain.com/api/auth/wechat/callback
```

#### JWT配置
```bash
# 必须使用强密钥（至少256位）
JWT_SECRET=please_change_this_to_a_very_strong_secret_key
```

#### 前端配置
```bash
FRONTEND_PORT=80  # 前端访问端口
```

### 端口配置

| 服务 | 容器内部端口 | 外部端口 | 说明 |
|------|------------|---------|------|
| Frontend | 80 | ${FRONTEND_PORT:-80} | Nginx前端服务 |
| Backend | 8080 | ${BACKEND_PORT:-8080} | Spring Boot API |
| MySQL | 3306 | ${MYSQL_PORT:-3306} | MySQL数据库 |

### 目录结构

```
neoaigc/
├── docker/
│   ├── frontend/
│   │   ├── Dockerfile          # 前端Docker镜像定义
│   │   └── nginx.conf         # 前端Nginx配置
│   ├── backend/
│   │   └── Dockerfile          # 后端Docker镜像定义
│   └── mysql/
│       └── init.sql           # 数据库初始化脚本
├── frontend-cdn/              # 前端静态文件
├── backend/                  # 后端源代码
│   ├── src/
│   ├── pom.xml
│   └── init.sql
├── docker-compose.yml         # Docker编排文件
├── .env                      # 环境变量配置
└── Docker部署指南.md          # 本文档
```

---

## 部署步骤

### 步骤1: 克隆项目

```bash
git clone <your-repository-url>
cd neoaigc
```

### 步骤2: 配置环境变量

```bash
# 编辑.env文件
nano .env

# 或使用vim
vim .env

# 或使用Windows记事本
notepad .env
```

**重要配置项**:

1. **数据库密码** - 修改`MYSQL_ROOT_PASSWORD`和`MYSQL_PASSWORD`为强密码
2. **AI密钥** - 配置腾讯混元AI的`HUNYUAN_SECRET_ID`和`HUNYUAN_SECRET_KEY`
3. **微信配置** - 配置微信登录的`WECHAT_APP_ID`和`WECHAT_APP_SECRET`
4. **JWT密钥** - 修改`JWT_SECRET`为至少256位的强密钥
5. **回调地址** - 修改`WECHAT_REDIRECT_URI`为您的实际域名

### 步骤3: 构建镜像

```bash
# 构建所有服务的镜像
docker-compose build

# 仅构建特定服务
docker-compose build backend
docker-compose build frontend
docker-compose build mysql
```

构建过程可能需要5-10分钟，取决于网络速度。

### 步骤4: 启动服务

```bash
# 后台启动所有服务
docker-compose up -d

# 查看启动日志
docker-compose logs -f

# 确认服务状态
docker-compose ps
```

**服务启动顺序**:
1. MySQL容器启动（约30秒）
2. 数据库初始化脚本执行
3. 后端容器启动（等待MySQL就绪）
4. 前端容器启动（依赖后端）

### 步骤5: 验证部署

```bash
# 检查容器状态
docker-compose ps

# 应该看到3个容器都处于Up状态
# neoaigc-mysql     Up    3306/tcp
# neoaigc-backend    Up    0.0.0.0:8080->8080/tcp
# neoaigc-frontend   Up    0.0.0.0:80->80/tcp
```

**浏览器测试**:

1. 访问前端: http://localhost
2. 检查API: http://localhost:8080/api/auth/wechat/qr-code
3. 测试微信登录功能

---

## 常用命令

### 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
docker-compose restart frontend
docker-compose restart mysql
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 实时查看日志（推荐用于调试）
docker-compose logs -f

# 查看特定服务日志
docker-compose logs backend
docker-compose logs -f backend

# 查看最近100行日志
docker-compose logs --tail=100 backend
```

### 容器管理

```bash
# 进入后端容器
docker-compose exec backend sh

# 进入MySQL容器
docker-compose exec mysql bash

# 在MySQL容器内执行SQL
docker-compose exec mysql mysql -u neoaigc -p neoaigc

# 查看容器资源使用
docker stats
```

### 数据管理

```bash
# 查看数据卷
docker volume ls

# 查看MySQL数据卷详情
docker volume inspect neoaigc-mysql-data

# 备份数据卷
docker run --rm -v neoaigc-mysql-data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-backup.tar.gz /data

# 恢复数据卷
docker run --rm -v neoaigc-mysql-data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql-backup.tar.gz -C /
```

---

## 运维管理

### 数据备份

#### 自动备份脚本

创建备份脚本 `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/data/backup"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份MySQL数据
docker exec neoaigc-mysql mysqldump -u neoaigc -p${MYSQL_PASSWORD} neoaigc > $BACKUP_DIR/neoaigc_$DATE.sql

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz $(docker volume inspect neoaigc-uploads | grep Mountpoint | cut -d'"' -f4)

# 删除30天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

**配置定时任务**:

```bash
# 编辑crontab
crontab -e

# 每天凌晨2点执行备份
0 2 * * * /path/to/backup.sh
```

### 日志管理

```bash
# 清理Docker日志（释放磁盘空间）
docker system prune -a

# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 清理所有未使用的资源
docker system prune --all --volumes
```

### 服务更新

```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker-compose build

# 停止旧容器
docker-compose down

# 启动新容器
docker-compose up -d
```

### 监控告警

```bash
# 查看容器健康状态
docker-compose ps

# 查看容器资源使用
docker stats neoaigc-backend neoaigc-frontend neoaigc-mysql

# 设置资源限制（在docker-compose.yml中）
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## 故障排查

### 问题1: 容器启动失败

**症状**: `docker-compose ps` 显示容器状态为 `Exited`

**排查步骤**:

```bash
# 查看容器日志
docker-compose logs backend
docker-compose logs mysql
docker-compose logs frontend

# 常见原因：
# 1. 端口被占用
netstat -tlnp | grep 8080

# 2. 配置文件错误
docker-compose config

# 3. 环境变量缺失
cat .env
```

### 问题2: 数据库连接失败

**症状**: 后端日志显示 `Connection refused` 或 `Access denied`

**解决方法**:

```bash
# 1. 检查MySQL容器状态
docker-compose ps mysql

# 2. 进入MySQL容器测试
docker-compose exec mysql mysql -u neoaigc -p neoaigc

# 3. 检查环境变量
docker-compose exec backend env | grep SPRING_DATASOURCE

# 4. 确认网络连通性
docker-compose exec backend ping mysql
```

### 问题3: 前端无法访问后端API

**症状**: 浏览器控制台显示 `Network Error` 或 `502 Bad Gateway`

**解决方法**:

```bash
# 1. 检查后端服务是否运行
curl http://localhost:8080/api/auth/wechat/qr-code

# 2. 检查Nginx配置
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# 3. 测试容器间网络
docker-compose exec frontend wget -O- http://backend:8080/api/auth/wechat/qr-code

# 4. 查看前端日志
docker-compose logs -f frontend
```

### 问题4: 文件上传失败

**症状**: 上传图片时显示错误

**解决方法**:

```bash
# 1. 检查上传目录权限
docker-compose exec backend ls -la /app/uploads

# 2. 修改权限（如果需要）
docker-compose exec backend chmod -R 755 /app/uploads

# 3. 检查Nginx配置
client_max_body_size 100M;

# 4. 检查磁盘空间
df -h
```

### 问题5: 内存不足

**症状**: 容器频繁重启，日志显示 `OOMKilled`

**解决方法**:

```bash
# 1. 增加Docker内存限制
# 在Docker Desktop设置中增加内存

# 2. 优化JVM参数
# 修改docker/backend/Dockerfile
ENV JAVA_OPTS="-Xms256m -Xmx512m"

# 3. 清理未使用的资源
docker system prune -a
```

### 问题6: 时间不正确

**症状**: 日志时间与系统时间不一致

**解决方法**:

```bash
# 1. 检查容器时区
docker-compose exec backend date

# 2. 配置时区（已在Dockerfile中配置）
ENV TZ=Asia/Shanghai

# 3. 同步宿主时间
docker-compose restart
```

---

## 生产环境优化

### 1. 使用HTTPS

**步骤**:

```bash
# 1. 获取SSL证书
# 使用Let's Encrypt免费证书
certbot certonly --standalone -d your-domain.com

# 或购买商业证书

# 2. 修改Nginx配置
# 更新 docker/frontend/nginx.conf
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
}

# 3. 挂载证书卷
# 在docker-compose.yml中添加
volumes:
  - ./ssl:/etc/nginx/ssl
```

### 2. 性能优化

#### 后端优化

```bash
# 1. 增加JVM内存
ENV JAVA_OPTS="-Xms512m -Xmx2g"

# 2. 配置数据库连接池
# 在application.yml中
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
```

#### Nginx优化

```nginx
# 在docker/frontend/nginx.conf中添加
worker_processes auto;
worker_connections 2048;

# 启用缓存
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g;
```

### 3. 安全加固

```bash
# 1. 修改默认端口
FRONTEND_PORT=8888
BACKEND_PORT=8889

# 2. 配置防火墙
ufw allow 8888/tcp
ufw allow 8889/tcp

# 3. 使用非root用户运行
# 在Dockerfile中添加
RUN adduser -D -u 1000 appuser
USER appuser

# 4. 限制容器权限
--cap-drop=all --cap-add=NET_BIND_SERVICE
```

### 4. 日志管理

```bash
# 1. 配置日志轮转
# 在docker-compose.yml中添加
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"

# 2. 使用ELK收集日志
# 集成Elasticsearch + Logstash + Kibana

# 3. 使用云日志服务
# 阿里云SLS、腾讯云CLS等
```

### 5. 监控告警

```bash
# 1. 安装监控工具
docker run -d -p 9090:9090 prom/prometheus
docker run -d -p 3000:3000 grafana/grafana

# 2. 配置健康检查
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
  interval: 30s
  timeout: 3s
  retries: 3

# 3. 设置告警规则
# 在Grafana中配置告警
```

---

## 附录

### A. 目录权限

```bash
# 设置正确的文件权限
chmod -R 755 docker
chmod 644 .env
chmod 644 docker-compose.yml
```

### B. 网络配置

```bash
# 查看Docker网络
docker network ls

# 查看网络详情
docker network inspect neoaigc-network

# 清理未使用的网络
docker network prune
```

### C. 环境变量优先级

环境变量的加载优先级（从高到低）：

1. docker-compose.yml 中的 environment
2. docker-compose.yml 中的 env_file
3. 宿主环境变量
4. .env 文件中的变量

### D. 常用端口

| 端口 | 服务 | 说明 |
|------|------|------|
| 80 | HTTP | Web访问 |
| 443 | HTTPS | 安全Web访问 |
| 8080 | Backend API | Spring Boot |
| 3306 | MySQL | 数据库 |
| 9090 | Prometheus | 监控（可选） |
| 3000 | Grafana | 监控面板（可选） |

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-12
**维护者**: NeoAI GC Team

**如有问题，请提交Issue或联系技术支持**
