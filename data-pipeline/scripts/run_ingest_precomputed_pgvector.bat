@echo off
setlocal

echo ==========================================
echo INGEST PRECOMPUTED EMBEDDINGS TO PGVECTOR
echo ==========================================
echo.

cd /d "%~dp0"

set EXPORT_DIR=..\data\processed\embedding_exports
set EMBEDDINGS_FILE=%EXPORT_DIR%\embeddings.npy
set RECORDS_FILE=%EXPORT_DIR%\records.jsonl
set RAW_DIR=..\data\raw

set DB_HOST=%~1
set DB_PORT=%~2
set DB_NAME=%~3
set DB_USER=%~4
set DB_PASSWORD=%~5
set TABLE_NAME=%~6
set DISTANCE=%~7
set BATCH_SIZE=%~8

if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set DB_NAME=chatbot_history_rag
if "%DB_USER%"=="" set DB_USER=admin
if "%DB_PASSWORD%"=="" set DB_PASSWORD=admin
if "%TABLE_NAME%"=="" set TABLE_NAME=rag_chunks
if "%DISTANCE%"=="" set DISTANCE=cosine
if "%BATCH_SIZE%"=="" set BATCH_SIZE=256

echo [1] Kich hoat virtual environment...
call ..\venv\Scripts\activate.bat
if errorlevel 1 (
  echo ❌ Khong the kich hoat virtual environment.
  exit /b 1
)

if not exist "%EMBEDDINGS_FILE%" (
  echo ❌ Khong tim thay file: %EMBEDDINGS_FILE%
  exit /b 1
)

if not exist "%RECORDS_FILE%" (
  echo ❌ Khong tim thay file: %RECORDS_FILE%
  exit /b 1
)

echo.
echo [2] Ingest vao PGVector...
python ingest_precomputed_embeddings_to_pgvector.py --embeddings "%EMBEDDINGS_FILE%" --records "%RECORDS_FILE%" --raw-dir "%RAW_DIR%" --db-host "%DB_HOST%" --db-port %DB_PORT% --db-name "%DB_NAME%" --db-user "%DB_USER%" --db-password "%DB_PASSWORD%" --table "%TABLE_NAME%" --distance "%DISTANCE%" --batch-size %BATCH_SIZE%
if errorlevel 1 (
  echo ❌ Loi ingest precomputed embeddings.
  exit /b 1
)

echo.
echo ==========================================
echo HOAN THANH
echo DB        : %DB_HOST%:%DB_PORT%/%DB_NAME%
echo Table     : %TABLE_NAME%
echo Distance  : %DISTANCE%
echo ==========================================
pause

endlocal
