@echo off
setlocal EnableDelayedExpansion

echo ================================
echo PDF EXTRACTOR - AUTO MODE
echo ================================
echo.

cd /d "%~dp0"

set RAW_DIR=..\data\raw
set PROCESSED_DIR=..\data\processed
set SCAN_JSON=..\data\processed\readable_scan_result.json
set MAX_PAGES=%~1
set TEST_PAGE_INDEX=%~2

echo [1] Kich hoat virtual environment...
call ..\venv\Scripts\activate.bat
if errorlevel 1 (
  echo ❌ Khong the kich hoat virtual environment.
  exit /b 1
)

echo.
echo [2] Cai dat pdfplumber + pymupdf (neu chua co)...
python -m pip install pdfplumber==0.10.3 --quiet
if errorlevel 1 exit /b 1
python -m pip install pymupdf --quiet
if errorlevel 1 exit /b 1

echo.
echo [3] Quet file PDF co the doc duoc text...
if "%TEST_PAGE_INDEX%"=="" (
  python test_pdf.py --dir "%RAW_DIR%" --output-json "%SCAN_JSON%"
) else (
  python test_pdf.py --dir "%RAW_DIR%" --test-page-index %TEST_PAGE_INDEX% --output-json "%SCAN_JSON%"
)
if errorlevel 1 (
  echo ❌ Loi khi quet PDF.
  exit /b 1
)

python -c "import json,sys; d=json.load(open(r'%SCAN_JSON%','r',encoding='utf-8')); n=len(d.get('readable_files',[])); print(f'Readable files: {n}'); sys.exit(0 if n>0 else 2)"
if errorlevel 2 (
  echo ⚠️ Khong co file PDF nao doc duoc text. Dung tai day.
  echo Bao cao scan: %SCAN_JSON%
  exit /b 0
)
if errorlevel 1 (
  echo ❌ Khong doc duoc bao cao scan JSON.
  exit /b 1
)

echo.
echo [4] Trich xuat cac file doc duoc...
set /a PROCESSED_COUNT=0
for /f "usebackq delims=" %%F in (`python -c "import json; d=json.load(open(r'%SCAN_JSON%','r',encoding='utf-8')); [print(x) for x in d.get('readable_files',[])]"`) do (
  set /a PROCESSED_COUNT+=1
  echo  - [!PROCESSED_COUNT!] %%F

  if "%MAX_PAGES%"=="" (
    python pdf_extractor.py --input "%RAW_DIR%\%%F" --output "%PROCESSED_DIR%\%%~nF_extracted.json"
  ) else (
    python pdf_extractor.py --input "%RAW_DIR%\%%F" --output "%PROCESSED_DIR%\%%~nF_extracted.json" --max-pages %MAX_PAGES%
  )

  if errorlevel 1 (
    echo ❌ Loi khi trich xuat file: %%F
    exit /b 1
  )
)

echo ✅ Da trich xuat !PROCESSED_COUNT! file doc duoc.

echo.
echo ================================
echo HOAN THANH!
echo Tham so:
echo   max_pages      = %MAX_PAGES%
echo   test_page_idx  = %TEST_PAGE_INDEX%
echo Bao cao scan: %SCAN_JSON%
echo Thu muc output: %PROCESSED_DIR%
echo ================================
pause

endlocal
