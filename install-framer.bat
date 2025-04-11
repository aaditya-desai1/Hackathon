@echo off
echo Installing Framer Motion...

cd frontend
echo Installing in frontend...
call npm install framer-motion --save

cd ..
echo Installing in root project...
call npm install framer-motion --save

echo Installation complete!
pause 