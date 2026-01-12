-- NeoAI GC 数据库初始化脚本
-- 执行方式: mysql -u root -p < init.sql

-- 创建数据库
CREATE DATABASE IF NOT EXISTS neoaigc DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE neoaigc;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    open_id VARCHAR(100) UNIQUE NOT NULL COMMENT '微信OpenID',
    union_id VARCHAR(100) COMMENT '微信UnionID',
    nickname VARCHAR(100) COMMENT '昵称',
    avatar VARCHAR(500) COMMENT '头像URL',
    balance INT DEFAULT 100 COMMENT '余额',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_open_id (open_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- AI任务表
CREATE TABLE IF NOT EXISTS ai_tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
    user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
    type VARCHAR(50) NOT NULL COMMENT '任务类型: TEXT_TO_IMAGE, IMAGE_TO_IMAGE, BATCH_MATTING, FACE_SWAP',
    prompt TEXT COMMENT '提示词',
    image_url VARCHAR(1000) COMMENT '输入图片URL',
    result_url VARCHAR(1000) COMMENT '结果URL',
    status VARCHAR(50) DEFAULT 'PENDING' COMMENT '状态: PENDING, PROCESSING, COMPLETED, FAILED',
    error_message TEXT COMMENT '错误信息',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI任务表';

-- 模板表
CREATE TABLE IF NOT EXISTS templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '模板ID',
    name VARCHAR(100) NOT NULL COMMENT '模板名称',
    description TEXT COMMENT '描述',
    type INT NOT NULL COMMENT '类型: 1-文生图 2-图生图 3-抠图 4-换脸',
    prompt TEXT NOT NULL COMMENT '提示词',
    preview_image VARCHAR(500) COMMENT '预览图URL',
    sort INT DEFAULT 0 COMMENT '排序',
    status INT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_type (type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模板表';

-- 插入示例模板数据
INSERT INTO templates (name, description, type, prompt, preview_image, sort) VALUES
('风景插画', 'Generate beautiful landscape illustration with vibrant colors and detailed scenery', 1, 'A beautiful landscape illustration, vibrant colors, detailed scenery, digital art style, high quality', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e', 1),
('卡通角色', 'Create cute cartoon character with expressive face and colorful outfit', 1, 'Cute cartoon character, expressive face, colorful outfit, kawaii style, high quality', 'https://images.unsplash.com/photo-1578632767115-351597cf2477', 2),
('赛博朋克城市', 'Futuristic cyberpunk cityscape with neon lights and flying vehicles', 1, 'Futuristic cyberpunk cityscape, neon lights, flying vehicles, dark atmosphere, high quality', 'https://images.unsplash.com/photo-1515630278258-407f66498911', 3),
('照片风格化', 'Transform photo into artistic painting style', 2, 'Transform photo into artistic painting style, oil painting texture, vibrant colors, high quality', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5', 1),
('背景增强', 'Enhance photo background and remove imperfections', 2, 'Enhance photo background, remove imperfections, improve lighting, high quality, professional', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 2),
('产品抠图', 'Remove background from product images with clean edges', 3, 'Remove background from product image, clean edges, transparent background, high quality', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30', 1),
('人像抠图', 'Remove background from portrait photos', 3, 'Remove background from portrait, keep person, clean edges, high quality', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 2),
('模特换脸', 'Swap face on model photo with target face', 4, 'Swap face on model photo with target face, natural blending, high quality', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 1),
('背景修复', 'Remove blemishes and enhance photo background details', 4, 'Remove blemishes, enhance background details, professional editing, high quality', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d', 2);

-- 显示表结构
SHOW TABLES;
