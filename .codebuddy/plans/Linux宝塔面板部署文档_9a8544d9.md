---
name: Linux宝塔面板部署文档
overview: 为NeoAI GC项目创建详细的Linux宝塔面板部署文档，包括后端和前端的部署步骤
todos:
  - id: write-env-prep
    content: 编写环境准备章节，包括宝塔面板安装和JDK配置
    status: completed
  - id: write-db-config
    content: 编写数据库配置章节，包括MySQL安装和SQL导入
    status: completed
  - id: write-backend-deploy
    content: 编写后端部署章节，包括打包上传和启动配置
    status: completed
  - id: write-frontend-deploy
    content: 编写前端部署章节，包括静态文件部署和Nginx配置
    status: completed
  - id: write-verification
    content: 编写部署验证章节，包括服务检查和测试
    status: completed
    dependencies:
      - write-backend-deploy
      - write-frontend-deploy
---

## 产品概述

为NeoAI GC项目创建详细的Linux宝塔面板部署文档，指导用户完成从环境准备到项目上线的完整部署流程。

## 核心功能

- 环境准备指南：Linux系统要求、宝塔面板安装、JDK配置
- 数据库配置：MySQL安装、数据库创建、SQL脚本导入
- 后端部署：Spring Boot应用打包、上传、配置运行
- 前端部署：Vue3静态文件部署、Nginx配置
- 部署验证：服务状态检查、功能测试