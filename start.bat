@echo off
chcp 65001 >nul
echo ========================================
echo NeoAI GC 一键启动脚本
echo ========================================
echo.

echo [1/3] 初始化数据库...
echo.
cd backend
mysql -u root -p < init.sql
if %errorlevel% equ 0 (
    echo [√] 数据库初始化成功
) else (
    echo [警告] 数据库可能已存在，继续启动...
)
cd ..

echo.
echo [2/3] 启动后端服务...
echo.
start "NeoAI GC Backend" cmd /k "cd /d %~dp0backend && echo 正在启动后端服务... && mvn spring-boot:run"

echo 等待后端启动...
timeout /t 30 /nobreak >nul

echo.
echo [3/3] 启动前端服务...
echo.
start "NeoAI GC Frontend" cmd /k "cd /d %~dp0frontend-cdn && echo 正在启动前端服务... && python -m http.server 3000"

echo.
echo ========================================
echo 服务启动完成！
echo ========================================
echo.
echo 后端地址: http://localhost:8080/api
echo 前端地址: http://localhost:3000
echo.
echo 请在浏览器中打开前端地址开始使用
echo.
pause
