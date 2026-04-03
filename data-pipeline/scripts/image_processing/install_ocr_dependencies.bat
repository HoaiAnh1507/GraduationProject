@echo off
REM Install OCR dependencies for PDF extraction

echo ============================================================
echo Installing OCR Dependencies
echo ============================================================
echo.

REM Activate virtual environment
call ..\venv\Scripts\activate.bat

REM Upgrade pip
echo [1/2] Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo [2/2] Installing OCR libraries (this may take a while)...
pip install paddleocr paddlepaddle pdf2image Pillow

echo.
echo ============================================================
echo Installation completed!
echo ============================================================
echo.
echo Note: pdf2image requires poppler. On Windows, you may need to:
echo   1. Download poppler from: https://github.com/oschwartz10612/poppler-windows/releases/
echo   2. Extract and add bin folder to PATH
echo   3. Or install via conda: conda install -c conda-forge poppler
echo.
pause
