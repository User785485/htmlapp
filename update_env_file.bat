@echo off
echo Mise u00e0 jour du fichier .env.local avec le pru00e9fixe www

echo # Configuration mise u00e0 jour %date% > .env.local
echo SITE_BASE_URL=https://www.my-muqabala.fr >> .env.local
echo. >> .env.local
echo # Configuration Supabase >> .env.local
echo NEXT_PUBLIC_SUPABASE_URL=https://prbidefjoqdrqwjeenxm.supabase.co >> .env.local
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmlkZWZqb3FkcnF3amVlbnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMzY3NDEsImV4cCI6MjA2MzYxMjc0MX0.FaiiU8DTqnBVkNjG2L3wkE0MCsKnit_CNdGMmP0oRME >> .env.local
echo SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmlkZWZqb3FkcnF3amVlbnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAzNjc0MSwiZXhwIjoyMDYzNjEyNzQxfQ.K-f19FXAPH-z2qfRGMS2zOUmsVJ-iya6l0xfEwlVf44 >> .env.local
echo. >> .env.local
echo # Autres configurations >> .env.local
echo NODE_ENV=production >> .env.local

echo Fichier .env.local mis u00e0 jour avec SITE_BASE_URL=https://www.my-muqabala.fr
