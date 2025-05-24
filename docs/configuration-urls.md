# Configuration des URLs de base

## Importance de SITE_BASE_URL
La variable d'environnement `SITE_BASE_URL` est cruciale pour le bon fonctionnement du systu00e8me, car elle du00e9termine le domaine utilisu00e9 pour gu00e9nu00e9rer les URLs d'accu00e8s aux documents HTML.

## Configuration correcte
1. Assurez-vous que `.env.local` contient la ligne suivante:
   ```
   SITE_BASE_URL=https://www.my-muqabala.fr
   ```
2. En cas de changement de domaine, mettez u00e0 jour cette variable uniquement.
3. Apru00e8s toute modification, redu00e9marrez l'application.

## Comment mettre u00e0 jour le domaine

Pour changer le domaine utilisu00e9 par l'application, exu00e9cutez simplement le script `update_env_file.bat` avec le nouveau domaine. Par exemple :

```bash
# Pour passer au domaine example.com
.\update_env_file.bat example.com

# Pour utiliser www.example.com
.\update_env_file.bat www.example.com
```

Ou modifiez directement le fichier `.env.local` :

```
SITE_BASE_URL=https://www.nouveau-domaine.com
```

## Ru00e9solution des problu00e8mes courants

### URLs incorrectes
Si les documents pointent vers un domaine incorrect (par exemple, `user785485.github.io` au lieu de `www.my-muqabala.fr`), vu00e9rifiez :

1. La valeur de `SITE_BASE_URL` dans le fichier `.env.local`
2. Que l'application a u00e9tu00e9 redu00e9marru00e9e apru00e8s la modification du fichier `.env.local`
3. Les logs de l'application qui devraient afficher : `u2705 SITE_BASE_URL correctement configuru00e9: https://www.my-muqabala.fr`

### Conflit de configuration
Assurez-vous qu'aucun autre fichier `.env` ne du00e9finit une valeur diffu00e9rente. Les fichiers de configuration sont chargu00e9s dans l'ordre suivant (du moins prioritaire au plus prioritaire) :

1. `.env`
2. `.env.local`
3. `.env.development` ou `.env.production` (selon l'environnement)
4. `.env.development.local` ou `.env.production.local` (selon l'environnement)

### Pour les du00e9veloppeurs
Les principaux fichiers qui utilisent `SITE_BASE_URL` sont :

1. `lib/supabase-storage-publisher.ts` - Gu00e9nu00e8re les URLs pour les documents publiu00e9s
2. `app/api/generate/route.ts` - Utilise le publisher pour cru00e9er et stocker les documents

Ces fichiers ont u00e9tu00e9 mis u00e0 jour pour avertir clairement si `SITE_BASE_URL` n'est pas du00e9fini.
