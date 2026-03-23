@echo off
title AI Smart Kitchen Launcher
echo ==========================================
echo       AI Smart Kitchen - Launcher
echo ==========================================
echo.

:: Check for API key
if not exist backend\.env (
    echo ERROR: backend\.env not found!
    echo Please copy backend\.env.example to backend\.env and add your API key.
    echo.
    pause
    exit /b 1
)

:: Start backend
echo [1/2] Starting AI Backend (FastAPI)...
start "AI Kitchen Backend" cmd /k "cd backend && pip install -r requirements.txt -q && uvicorn main:app --reload --port 8000"

timeout /t 3 /noisy >nul

:: Start frontend
echo [2/2] Starting Frontend (React + Vite)...
start "AI Kitchen Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ==========================================
echo  App starting at: http://localhost:5173
echo  Backend API at:  http://localhost:8000
echo ==========================================
echo.
echo Press any key to open the browser...
pause >nul
start http://localhost:5173
