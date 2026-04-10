@echo off
setlocal

echo ==========================================
echo PREPARE (PARQUET->JSONL) + INGEST PGVECTOR
echo ==========================================
echo.

cd /d "%~dp0"

set EXPORT_DIR=..\data\processed\embedding_exports
set PARQUET_FILE=%EXPORT_DIR%\chunk_metadata.parquet
set RECORDS_FILE=%EXPORT_DIR%\records.jsonl

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
if "%DB_NAME%"=="" set DB_NAME=history_rag
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

if not exist "%PARQUET_FILE%" (
  echo ❌ Khong tim thay file: %PARQUET_FILE%
  exit /b 1
)

echo.
echo [2] Convert parquet -> records.jsonl...
python convert_chunk_metadata_to_records_jsonl.py --input "%PARQUET_FILE%" --output "%RECORDS_FILE%"
if errorlevel 1 (
  echo ❌ Loi convert parquet.
  exit /b 1
)

echo.
echo [3] Ingest vao PGVector...
call run_ingest_precomputed_pgvector.bat %DB_HOST% %DB_PORT% %DB_NAME% %DB_USER% %DB_PASSWORD% %TABLE_NAME% %DISTANCE% %BATCH_SIZE%
if errorlevel 1 (
  echo ❌ Loi ingest precomputed embeddings.
  exit /b 1
)

endlocal
