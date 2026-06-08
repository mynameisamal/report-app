@echo off
title TaskMaster PEI - Microservices
echo ============================================
echo   TaskMaster PEI - Starting All Services
echo ============================================
echo.
echo Starting 6 microservices + API Gateway...
echo.
echo Press Ctrl+C to stop all services
echo.
cd /d "%~dp0"
npm run dev:services
pause
