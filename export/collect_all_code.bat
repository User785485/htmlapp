@echo off
echo Collecte de tous les fichiers de code en cours...

set OUTPUT_FILE=export\all_code_debug.txt

echo # HTML Personalizer V2 - DUMP COMPLET DU CODE > %OUTPUT_FILE%
echo # Genere le %date% a %time% >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ## FICHIERS CSV >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%
echo ### test_csv_format.csv >> %OUTPUT_FILE%
echo ```csv >> %OUTPUT_FILE%
type test_csv_format.csv >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ### test_csv_complet.csv >> %OUTPUT_FILE%
echo ```csv >> %OUTPUT_FILE%
type test_csv_complet.csv >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ## FICHIERS PRINCIPAUX >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ### lib/csv-parser.ts >> %OUTPUT_FILE%
echo ```typescript >> %OUTPUT_FILE%
type lib\csv-parser.ts >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ### lib/document-generator.ts >> %OUTPUT_FILE%
echo ```typescript >> %OUTPUT_FILE%
type lib\document-generator.ts >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ### lib/github-publisher.ts >> %OUTPUT_FILE%
echo ```typescript >> %OUTPUT_FILE%
type lib\github-publisher.ts >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ### lib/supabase-client.ts >> %OUTPUT_FILE%
echo ```typescript >> %OUTPUT_FILE%
type lib\supabase-client.ts >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ### app/api/generate/route.ts >> %OUTPUT_FILE%
echo ```typescript >> %OUTPUT_FILE%
type app\api\generate\route.ts >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ### components/Dashboard.tsx >> %OUTPUT_FILE%
echo ```typescript >> %OUTPUT_FILE%
type components\Dashboard.tsx >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ## TEMPLATES HTML >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ### templates/protection.html >> %OUTPUT_FILE%
echo ```html >> %OUTPUT_FILE%
type templates\protection.html >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ### templates/vente/template.html >> %OUTPUT_FILE%
echo ```html >> %OUTPUT_FILE%
IF EXIST templates\vente\template.html type templates\vente\template.html >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ### templates/compte-rendu/template.html >> %OUTPUT_FILE%
echo ```html >> %OUTPUT_FILE%
IF EXIST templates\compte-rendu\template.html type templates\compte-rendu\template.html >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ### templates/onboarding/template.html >> %OUTPUT_FILE%
echo ```html >> %OUTPUT_FILE%
IF EXIST templates\onboarding\template.html type templates\onboarding\template.html >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ## FICHIERS DE LOGS >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ### lib/logger.ts >> %OUTPUT_FILE%
echo ```typescript >> %OUTPUT_FILE%
type lib\logger.ts >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

echo ## VARIABLES D'ENVIRONNEMENT >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%
echo ```env >> %OUTPUT_FILE%
type env-fix.txt >> %OUTPUT_FILE%
echo ``` >> %OUTPUT_FILE%

echo Collecte terminee. Fichier genere: %OUTPUT_FILE%
echo Appuyez sur une touche pour ouvrir le fichier...
pause > nul
start notepad %OUTPUT_FILE%
