@echo off
title Sistema Padeiro - NexusGestor
color 0A
echo ===================================
echo    NEXUSGESTOR - Sistema Padeiro
echo =========================================
echo.
echo  Iniciando servidor...
echo.
cd /d "%~dp0"
node server.js
pause
