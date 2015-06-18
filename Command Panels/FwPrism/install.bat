@echo off&MODE CON COLS=80 LINES=20
TITLE FwPrism installing...
COLOR 4E
cls
xcopy/y/e/i "E:\Working\Temp\FwPrism" "D:\Program Files (x86)\Adobe\Adobe Fireworks CS6\Configuration\Command Panels\FwPrism"
echo.
echo.
echo.
echo.
echo ==========================================
echo      FwPrism installation successful!
echo ==========================================
echo.
echo 
echo 
choice /t 8 /d y /n >nul
del/f/q "C:\Users\Admin\AppData\Roaming\Adobe\Fireworks CS6\Command Panels\FwPrism\install.jsf"
del/f/q "C:\Users\Admin\AppData\Roaming\Adobe\Fireworks CS6\Command Panels\FwPrism\install.bat"
echo 
del/f/q %0
