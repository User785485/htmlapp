# Variables requises pour les templates HTML

Ce document liste toutes les variables utilisées dans les templates HTML et comment les formater dans votre fichier CSV.

## Structure du CSV avec préfixes

La méthode recommandée est d'utiliser des préfixes pour chaque type de document :

- `vente_xxx` pour les variables du template de vente
- `cr_xxx` pour les variables du template de compte-rendu
- `onb_xxx` pour les variables du template d'onboarding

Exemple :
```csv
email,telephone,prenom,nom,vente_produit,vente_prix,cr_date_rencontre,onb_etapes,...
```

## Variables par template

### 1. Variables communes (sans préfixe)

| Variable CSV | Description |
|--------------|-------------|
| prenom | Prénom du client |
| nom | Nom du client |
| email | Email du client |
| telephone | Téléphone du client |

### 2. Template de vente (`vente_xxx`)

| Variable CSV | Variable template | Description |
|--------------|-------------------|-------------|
| vente_produit | {{PRODUIT}} | Nom du produit/service |
| vente_prix | {{PRIX}} | Prix du produit |
| vente_prix_reference | {{PRIX_REFERENCE}} | Prix de référence (barré) |
| vente_prix_unique | {{PRIX_UNIQUE}} | Prix unique/promotionnel |
| vente_economie_unique | {{ECONOMIE_UNIQUE}} | Montant économisé |
| vente_formule_recommandee | {{FORMULE_RECOMMANDEE}} | Nom du package |
| vente_mensualite_3x | {{MENSUALITE_3X}} | Montant mensualité en 3 fois |
| vente_mensualite_6x | {{MENSUALITE_6X}} | Montant mensualité en 6 fois |
| vente_places_disponibles | {{PLACES_DISPONIBLES}} | Nombre de places disponibles |
| vente_date_debut_programme | {{DATE_DEBUT_PROGRAMME}} | Date de début du programme |
| vente_numero_whatsapp | {{NUMERO_WHATSAPP}} | Numéro WhatsApp |
| vente_offre_speciale | {{OFFRE_SPECIALE}} | Description offre spéciale |
| vente_objectifs | {{OBJECTIFS}} | Objectifs du client |
| vente_date_rencontre | {{DATE_RENCONTRE}} | Date de la rencontre |

### 3. Template de compte-rendu (`cr_xxx`)

| Variable CSV | Variable template | Description |
|--------------|-------------------|-------------|
| cr_date_rencontre | {{DATE_RENCONTRE}} | Date de la rencontre |
| cr_produit | {{PRODUIT}} | Nom du produit/service |
| cr_objectifs | {{OBJECTIFS}} | Objectifs du client |
| cr_recommandations_liste | {{RECOMMANDATIONS_LISTE}} | Liste HTML des recommandations |
| cr_offre_speciale | {{OFFRE_SPECIALE}} | Description offre spéciale |
| cr_places_disponibles | {{PLACES_DISPONIBLES}} | Nombre de places disponibles |
| cr_date_debut_programme | {{DATE_DEBUT_PROGRAMME}} | Date de début du programme |
| cr_numero_whatsapp | {{NUMERO_WHATSAPP}} | Numéro WhatsApp |

### 4. Template d'onboarding (`onb_xxx`)

| Variable CSV | Variable template | Description |
|--------------|-------------------|-------------|
| onb_produit | {{PRODUIT}} | Nom du produit/service |
| onb_date_debut | {{DATE_DEBUT}} | Date de début du programme |
| onb_etapes | {{ETAPES}} | Étapes d'onboarding en HTML |
| onb_conseils | {{CONSEILS}} | Conseils en HTML |
| onb_objectifs | {{OBJECTIFS}} | Objectifs du client |
| onb_numero_whatsapp | {{NUMERO_WHATSAPP}} | Numéro WhatsApp |

## Format HTML pour les listes

Pour les variables qui nécessitent une mise en forme HTML (comme `cr_recommandations_liste`, `onb_etapes`, `onb_conseils`), utilisez le format suivant dans votre CSV :

```
"• Point 1<br>• Point 2<br>• Point 3"
```

Ou avec des balises HTML complètes :

```
"<ul><li>Point 1</li><li>Point 2</li><li>Point 3</li></ul>"
```

## Exemple de fichier CSV complet

Voir le fichier `test_csv_prefixes.csv` pour un exemple complet de fichier CSV avec toutes les variables.
