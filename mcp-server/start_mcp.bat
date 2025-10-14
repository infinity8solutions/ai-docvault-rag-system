@echo off
REM MCP Server Startup Script for Windows
REM Starts the Contextual Knowledge Base MCP Server

echo ========================================
echo Starting MCP Server
echo ========================================
echo.
echo Server will be available at: http://localhost:3000/mcp
echo Health check: http://localhost:3000/health
echo.
echo Make sure ChromaDB server is running!
echo.
echo Press Ctrl+C to stop the server
echo.

REM Run the MCP server in development mode
cd /d "%~dp0"
npm run dev
