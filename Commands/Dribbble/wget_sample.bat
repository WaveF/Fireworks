@echo off
cls
REM 一定会创建log，可以指定log名称，加-q代表输出空log
wget -b http://www.baidu.com/img/bd_logo1.png -O c:\bd.png -o mylog -q