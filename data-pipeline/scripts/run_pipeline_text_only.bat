@echo off
setlocal

echo ==========================================
echo TEXT-ONLY DATA PIPELINE (NO OCR)
echo ==========================================
echo.

cd /d "%~dp0"

set RAW_DIR=..\data\raw
set PROCESSED_DIR=..\data\processed
set DB_PATH=..\chroma_db
set COLLECTION=vietnam_history_chunks

if "%~1"=="" (
  echo Usage:
  echo   run_pipeline_text_only.bat "PDF_FILE_NAME.pdf"
  echo.
  echo Example:
  echo   run_pipeline_text_only.bat "Lch s Vit Nam tp 01 T khi thy n th k X-Cao Duy Mn-2013.pdf"
  exit /b 1
)

set PDF_NAME=%~1
set PDF_PATH=%RAW_DIR%\%PDF_NAME%
set EXTRACTED_JSON=%PROCESSED_DIR%\%PDF_NAME:.pdf=_extracted.json%
set CHUNKS_JSON=%PROCESSED_DIR%\%PDF_NAME:.pdf=_extracted_chunks.json%

echo [1/3] Extract text + bbox from PDF...
python pdf_extractor.py --input "%PDF_PATH%" --output "%EXTRACTED_JSON%"
if errorlevel 1 exit /b 1

echo.
echo [2/3] Chunk extracted text...
python chunk_extracted_json.py --input "%EXTRACTED_JSON%" --output "%CHUNKS_JSON%" --chunk-size 220 --overlap 40 --min-chunk-words 50
if errorlevel 1 exit /b 1

echo.
echo [3/3] Ingest chunks to ChromaDB...
python ingest_chunks_to_chromadb.py --input "%CHUNKS_JSON%" --db-path "%DB_PATH%" --collection "%COLLECTION%"
if errorlevel 1 exit /b 1

echo.
echo ==========================================
echo DONE
echo Extracted JSON: %EXTRACTED_JSON%
echo Chunks JSON:    %CHUNKS_JSON%
echo Chroma DB:      %DB_PATH%
echo Collection:     %COLLECTION%
echo ==========================================

endlocal
