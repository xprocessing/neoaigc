# NeoAI GC Frontend - Vue3 CDN Static Files
FROM nginx:1.25-alpine

# 复制前端静态文件
COPY ../frontend-cdn /usr/share/nginx/html

# 复制Nginx配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
