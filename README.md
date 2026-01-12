# NeoAI GC - AI图片视频生成平台

一个基于Spring Boot + Vue 3 CDN的AI图片和视频生成平台，支持文生图、图生图、批量抠图、智能换脸等功能。

## 技术栈

### 后端
- Spring Boot 3.2.0
- Spring Security + JWT
- MyBatis
- MySQL 8.0
- 腾讯混元AI SDK

### 前端
- Vue 3 (CDN方式，无需Node.js)
- Axios
- Tailwind CSS
- Lucide Icons

## 功能特性

### 用户认证
- 微信扫码登录
- JWT Token认证
- 用户信息管理

### AI生成功能
1. **文生图** - 输入文字描述生成图片
2. **图生图** - 上传图片并基于参考生成新图
3. **批量抠图** - 智能去除多张图片背景
4. **智能换脸** - 模特换脸+背景瑕疵处理

### 模板系统
- 快速模板选择
- 预设提示词
- 一键生成

### 任务管理
- 异步任务处理
- 任务状态追踪
- 历史记录查看

## 快速开始

### 环境要求

- JDK 17+
- Maven 3.6+
- MySQL 8.0+
- 浏览器（Chrome、Firefox、Edge等）

### 数据库初始化

```bash
cd backend
mysql -u root -p < init.sql
```

### 配置API密钥

编辑 `backend/src/main/resources/application.yml`：

```yaml
hunyuan:
  api:
    secret-id: your-secret-id
    secret-key: your-secret-key

wechat:
  app-id: your-wechat-app-id
  app-secret: your-wechat-app-secret

jwt:
  secret: your-jwt-secret-key-at-least-256-bits
```

### 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端地址：http://localhost:8080/api

### 启动前端

直接在浏览器中打开：
```
frontend-cdn/index.html
```

或使用HTTP服务器：
```bash
cd frontend-cdn
python -m http.server 3000
```

前端地址：http://localhost:3000

## 项目结构

```
neoaigc/
├── backend/                          # Spring Boot后端
│   ├── src/main/java/com/neoaigc/
│   │   ├── controller/               # REST API控制器
│   │   ├── service/                  # 业务逻辑层
│   │   ├── entity/                   # 数据库实体
│   │   ├── mapper/                   # MyBatis Mapper
│   │   ├── config/                   # 配置类
│   │   ├── security/                 # 安全配置
│   │   └── util/                    # 工具类
│   ├── src/main/resources/
│   │   ├── application.yml          # 配置文件
│   │   └── mapper/                 # MyBatis XML
│   ├── init.sql                     # 数据库初始化脚本
│   └── pom.xml                     # Maven配置
├── frontend-cdn/                    # Vue 3 CDN前端
│   ├── index.html                   # 主入口
│   ├── css/
│   │   └── style.css              # 自定义样式
│   └── js/
│       └── app.js                 # Vue应用
├── docs/                           # 项目文档
└── dev-log/                        # 开发日志
```

## API文档

### 认证接口

#### 获取微信登录二维码
```
GET /api/auth/wechat/qr-code
```

#### 微信登录回调
```
GET /api/auth/wechat/callback?code=xxx&state=xxx
```

#### 获取用户信息
```
GET /api/auth/user/info
Headers: Authorization: Bearer {token}
```

### 模板接口

#### 获取所有模板
```
GET /api/template/list
```

#### 根据类型获取模板
```
GET /api/template/list/type/{type}
```

### 任务接口

#### 创建任务
```
POST /api/task/create
Content-Type: multipart/form-data
Form Data:
  - type: TEXT_TO_IMAGE | IMAGE_TO_IMAGE | BATCH_MATTING | FACE_SWAP
  - prompt: 提示词
  - file: 图片文件（可选）
Headers: Authorization: Bearer {token}
```

#### 获取任务详情
```
GET /api/task/{id}
Headers: Authorization: Bearer {token}
```

#### 获取用户任务列表
```
GET /api/task/list?type=xxx
Headers: Authorization: Bearer {token}
```

## 开发指南

### 后端开发

1. 在 `controller` 包中创建新的Controller
2. 在 `service` 包中实现业务逻辑
3. 在 `mapper` 包中定义数据访问接口
4. 在 `resources/mapper` 中编写MyBatis XML

### 前端开发

1. 在 `js/app.js` 中添加新的Vue组件
2. 使用Axios调用后端API
3. 使用Tailwind CSS进行样式设计

## 常见问题

### 后端启动失败

- 检查Java版本是否为JDK 17+
- 检查MySQL服务是否启动
- 检查数据库连接配置

### 前端无法连接后端

- 检查后端是否启动
- 检查CORS配置
- 检查API地址是否正确

### 微信登录失败

- 检查微信开放平台配置
- 检查AppID和AppSecret是否正确
- 检查回调地址是否已配置

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT License
