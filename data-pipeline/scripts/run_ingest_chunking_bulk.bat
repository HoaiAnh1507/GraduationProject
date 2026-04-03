@echo off
setlocal EnableDelayedExpansion

echo ==========================================
echo BULK INGEST CHUNK JSON TO CHROMADB
echo ==========================================
echo.

cd /d "%~dp0"

set INPUT_DIR=..\data\processed\extracted_chunking
set DB_PATH=..\chroma_db
set COLLECTION=%~1
set MODEL=%~2
set BATCH_SIZE=%~3

if "%COLLECTION%"=="" set COLLECTION=vietnam_history_chunks
if "%MODEL%"=="" set MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
if "%BATCH_SIZE%"=="" set BATCH_SIZE=64

echo [1] Kich hoat virtual environment...
call ..\venv\Scripts\activate.bat
if errorlevel 1 (
  echo ❌ Khong the kich hoat virtual environment.
  exit /b 1
)

echo.
echo [2] Bat dau ingest hang loat...
echo Input dir : %INPUT_DIR%
echo DB path   : %DB_PATH%
echo Collection: %COLLECTION%
echo Model     : %MODEL%
echo Batch size: %BATCH_SIZE%
echo.

set /a TOTAL=0
set /a OK=0
set /a FAIL=0

for %%F in ("%INPUT_DIR%\*_chunks.json") do (
  if exist "%%~fF" (
    set /a TOTAL+=1
    echo [!TOTAL!] Ingest: %%~nxF

    python ingest_chunks_to_chromadb.py --input "%%~fF" --db-path "%DB_PATH%" --collection "%COLLECTION%" --model "%MODEL%" --batch-size %BATCH_SIZE%
    if errorlevel 1 (
      echo    ❌ Loi ingest: %%~nxF
      set /a FAIL+=1
    ) else (
      echo    ✅ OK
      set /a OK+=1
    )
    echo.
  )
)

if %TOTAL%==0 (
  echo ⚠️ Khong tim thay file nao theo mau: %INPUT_DIR%\*_chunks.json
  exit /b 1
)

echo ==========================================
echo HOAN THANH BULK INGEST
echo Tong file : %TOTAL%
echo Thanh cong: %OK%
echo That bai  : %FAIL%
echo DB path   : %DB_PATH%
echo Collection: %COLLECTION%
echo ==========================================
pause

endlocal
