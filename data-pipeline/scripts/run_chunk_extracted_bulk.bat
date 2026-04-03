@echo off
setlocal EnableDelayedExpansion

echo ==========================================
echo BULK CHUNKING FROM EXTRACTED JSON
echo ==========================================
echo.

cd /d "%~dp0"

set INPUT_DIR=..\data\processed\extracted
set OUTPUT_DIR=..\data\processed\extracted_chunking
set CHUNK_SIZE=%~1
set OVERLAP=%~2
set MIN_WORDS=%~3

if "%CHUNK_SIZE%"=="" set CHUNK_SIZE=220
if "%OVERLAP%"=="" set OVERLAP=40
if "%MIN_WORDS%"=="" set MIN_WORDS=50

echo [1] Kich hoat virtual environment...
call ..\venv\Scripts\activate.bat
if errorlevel 1 (
  echo ❌ Khong the kich hoat virtual environment.
  exit /b 1
)

echo.
echo [2] Tao thu muc output neu chua co...
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo.
echo [3] Bat dau chunking hang loat...
echo Input dir : %INPUT_DIR%
echo Output dir: %OUTPUT_DIR%
echo chunk-size=%CHUNK_SIZE%, overlap=%OVERLAP%, min-words=%MIN_WORDS%
echo.

set /a TOTAL=0
set /a OK=0
set /a FAIL=0

for %%F in ("%INPUT_DIR%\*_extracted.json") do (
  if exist "%%~fF" (
    set /a TOTAL+=1
    set "OUT_FILE=%OUTPUT_DIR%\%%~nF_chunks.json"
    echo [!TOTAL!] Chunking: %%~nxF

    python chunk_extracted_json.py --input "%%~fF" --output "!OUT_FILE!" --chunk-size %CHUNK_SIZE% --overlap %OVERLAP% --min-chunk-words %MIN_WORDS%
    if errorlevel 1 (
      echo    ❌ Loi: %%~nxF
      set /a FAIL+=1
    ) else (
      echo    ✅ OK: !OUT_FILE!
      set /a OK+=1
    )
    echo.
  )
)

if %TOTAL%==0 (
  echo ⚠️ Khong tim thay file nao theo mau: %INPUT_DIR%\*_extracted.json
  exit /b 1
)

echo ==========================================
echo HOAN THANH BULK CHUNKING
echo Tong file : %TOTAL%
echo Thanh cong: %OK%
echo That bai  : %FAIL%
echo Output    : %OUTPUT_DIR%
echo ==========================================
pause

endlocal
