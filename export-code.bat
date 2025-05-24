@echo off
echo Compilation de tout le code de l'application en cours...

:: Crée le dossier de sortie si nécessaire
mkdir .\export 2>NUL

:: Définir le fichier de sortie
set OUTPUT_FILE=.\export\all_code.txt

:: Vider le fichier s'il existe déjà
echo. > %OUTPUT_FILE%

echo Date et heure d'export: %DATE% %TIME% >> %OUTPUT_FILE%
echo. >> %OUTPUT_FILE%

:: Liste des extensions de fichiers à inclure
set FILE_TYPES=*.ts *.tsx *.js *.jsx *.json *.html *.css *.md

:: Exporter tous les fichiers des dossiers importants
echo # Exporting app folder files >> %OUTPUT_FILE%
for %%t in (%FILE_TYPES%) do (
    for /r .\app %%f in (%%t) do (
        echo. >> %OUTPUT_FILE%
        echo. >> %OUTPUT_FILE%
        echo ============================================== >> %OUTPUT_FILE%
        echo FILE: %%f >> %OUTPUT_FILE%
        echo ============================================== >> %OUTPUT_FILE%
        type "%%f" >> %OUTPUT_FILE% 2>NUL || echo [ERREUR: Impossible d'accéder au fichier] >> %OUTPUT_FILE%
    )
)

echo # Exporting lib folder files >> %OUTPUT_FILE%
for %%t in (%FILE_TYPES%) do (
    for /r .\lib %%f in (%%t) do (
        echo. >> %OUTPUT_FILE%
        echo. >> %OUTPUT_FILE%
        echo ============================================== >> %OUTPUT_FILE%
        echo FILE: %%f >> %OUTPUT_FILE%
        echo ============================================== >> %OUTPUT_FILE%
        type "%%f" >> %OUTPUT_FILE% 2>NUL || echo [ERREUR: Impossible d'accéder au fichier] >> %OUTPUT_FILE%
    )
)

echo # Exporting components folder files >> %OUTPUT_FILE%
for %%t in (%FILE_TYPES%) do (
    for /r .\components %%f in (%%t) do (
        echo. >> %OUTPUT_FILE%
        echo. >> %OUTPUT_FILE%
        echo ============================================== >> %OUTPUT_FILE%
        echo FILE: %%f >> %OUTPUT_FILE%
        echo ============================================== >> %OUTPUT_FILE%
        type "%%f" >> %OUTPUT_FILE% 2>NUL || echo [ERREUR: Impossible d'accéder au fichier] >> %OUTPUT_FILE%
    )
)

echo # Exporting templates folder files >> %OUTPUT_FILE%
for %%t in (%FILE_TYPES%) do (
    for /r .\templates %%f in (%%t) do (
        echo. >> %OUTPUT_FILE%
        echo. >> %OUTPUT_FILE%
        echo ============================================== >> %OUTPUT_FILE%
        echo FILE: %%f >> %OUTPUT_FILE%
        echo ============================================== >> %OUTPUT_FILE%
        type "%%f" >> %OUTPUT_FILE% 2>NUL || echo [ERREUR: Impossible d'accéder au fichier] >> %OUTPUT_FILE%
    )
)

echo # Exporting root files >> %OUTPUT_FILE%
for %%t in (%FILE_TYPES%) do (
    for %%f in (.\%%t) do (
        echo. >> %OUTPUT_FILE%
        echo. >> %OUTPUT_FILE%
        echo ============================================== >> %OUTPUT_FILE%
        echo FILE: %%f >> %OUTPUT_FILE%
        echo ============================================== >> %OUTPUT_FILE%
        type "%%f" >> %OUTPUT_FILE% 2>NUL || echo [ERREUR: Impossible d'accéder au fichier] >> %OUTPUT_FILE%
    )
)

echo # Exporting other important files >> %OUTPUT_FILE%
for %%f in (package.json tsconfig.json next.config.js .env.example README.md) do (
    echo. >> %OUTPUT_FILE%
    echo. >> %OUTPUT_FILE%
    echo ============================================== >> %OUTPUT_FILE%
    echo FILE: %%f >> %OUTPUT_FILE%
    echo ============================================== >> %OUTPUT_FILE%
    type "%%f" >> %OUTPUT_FILE% 2>NUL || echo [ERREUR: Impossible d'accéder au fichier] >> %OUTPUT_FILE%
)

echo.
echo.
echo Terminé ! Tous les fichiers ont été exportés dans %OUTPUT_FILE%
echo Les erreurs d'accès aux fichiers ont été ignorées.
echo.
