-- Script de correction COMPLET des URLs GitHub dans Supabase
-- Ce script remplace les anciennes URLs GitHub par les nouvelles URLs my-muqabala.fr
-- avec la BONNE structure de chemin

-- Mettre à jour les URLs de vente
UPDATE generated_documents
SET vente_url = REPLACE(
    REPLACE(vente_url, 
        'https://user785485.github.io/soulful-connections-new/protected-pages/', 
        'https://my-muqabala.fr/api/documents/'
    ),
    'https://my-muqabala.fr/protected-pages/',
    'https://my-muqabala.fr/api/documents/'
)
WHERE vente_url LIKE '%github.io%' 
   OR vente_url LIKE '%my-muqabala.fr/protected-pages%';

-- Mettre à jour les URLs de compte-rendu
UPDATE generated_documents
SET compte_rendu_url = REPLACE(
    REPLACE(compte_rendu_url, 
        'https://user785485.github.io/soulful-connections-new/protected-pages/', 
        'https://my-muqabala.fr/api/documents/'
    ),
    'https://my-muqabala.fr/protected-pages/',
    'https://my-muqabala.fr/api/documents/'
)
WHERE compte_rendu_url LIKE '%github.io%'
   OR compte_rendu_url LIKE '%my-muqabala.fr/protected-pages%';

-- Mettre à jour les URLs d'onboarding
UPDATE generated_documents
SET onboarding_url = REPLACE(
    REPLACE(onboarding_url, 
        'https://user785485.github.io/soulful-connections-new/protected-pages/', 
        'https://my-muqabala.fr/api/documents/'
    ),
    'https://my-muqabala.fr/protected-pages/',
    'https://my-muqabala.fr/api/documents/'
)
WHERE onboarding_url LIKE '%github.io%'
   OR onboarding_url LIKE '%my-muqabala.fr/protected-pages%';

-- Vérifier les résultats
SELECT 
    client_email,
    vente_url,
    compte_rendu_url,
    onboarding_url
FROM generated_documents
WHERE vente_url LIKE '%my-muqabala.fr%'
LIMIT 5;