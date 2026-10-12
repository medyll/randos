# Rando tentative

Une page statique pour choisir une randonnée dans les Alpes-Maritimes et consulter les événements de sa vallée à la date prévue.

Le catalogue contient **221 itinéraires**, dont 217 sorties à la journée et 4 itinérances. Il couvre la Tinée, la Vésubie, le Var, la Roya, le secteur Roya / Bévéra et le Cians. Une randonnée peut traverser plusieurs secteurs.

## Ouvrir la page

Ouvrez `randos/randos.html` dans votre navigateur. Les données, les filtres et les tracés fonctionnent sans serveur et sans connexion ; les liens vers les offices de tourisme, les cartes officielles et les fichiers GPX demandent Internet.

Pour préparer et prévisualiser la version destinée à GitHub Pages, utilisez Node.js 22 ou une version plus récente :

```sh
node scripts/check.mjs
node scripts/build.mjs
node scripts/serve.mjs
```

Le serveur local répond à `http://127.0.0.1:4173/`. Aucune installation npm n’est nécessaire.

## Publier sur GitHub Pages

Placez le projet dans un dépôt GitHub dont la branche de publication s’appelle `main`. Dans **Settings → Pages → Build and deployment**, choisissez **GitHub Actions** comme source, puis poussez les fichiers sur `main`.

Le workflow `.github/workflows/pages.yml` vérifie le catalogue, prépare le dossier `dist` et publie son contenu. L’onglet **Actions** indique l’URL du site après le déploiement. Si votre branche porte un autre nom, modifiez la valeur `branches` du workflow.

Tous les chemins de ressources sont relatifs. La page fonctionne donc aussi sous un préfixe de dépôt, par exemple `https://UTILISATEUR.github.io/rando-tentative/`. Les fiches utilisent des ancres `#rando-…`, afin que les liens directs ne provoquent pas d’erreur 404 sur GitHub Pages.

Le fichier source s’appelle `randos/randos.html` ; le script de préparation en produit une copie `dist/index.html`, comme l’attend GitHub Pages. Le dossier `dist` n’a pas besoin d’être commité.

Documentation GitHub : [publier avec un workflow personnalisé](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Utilisation

Sur ordinateur, cliquez sur une entête du tableau pour changer de tri ; un second clic inverse l’ordre. Sur mobile, la liste devient une série de cartes et le menu **Trier par** donne accès aux mêmes critères. Le tri du plan utilise la distance du parcours.

Les cases à cocher permettent de combiner les vallées, les tranches de dénivelé positif de 500 m, les cols, les sommets et les lacs. Plusieurs vallées ou tranches fonctionnent comme des alternatives ; plusieurs éléments du parcours doivent tous être présents. Les tranches qui ne contiennent aucun itinéraire ne s’affichent pas.

La recherche accepte les noms sans accents et porte sur l’itinéraire, le départ et l’arrivée. Les filtres **À la journée uniquement** et **Avec un événement dans la vallée** complètent la sélection. Les paramètres dans l’URL conservent la sélection et la date lorsque vous partagez un lien ou rechargez la page.

Cliquez sur un nom ou sur sa ligne pour ouvrir la fiche : tracé GPS, profil d’altitude, dénivelés positif et négatif, distance, durée, coordonnées de départ, difficulté, carte et topo PDF, liens GPX et sources officielles. Le retour à la liste conserve les filtres.

L’agenda affiche le jour choisi ou la semaine du lundi au dimanche. Le filtre de vallée s’applique à l’agenda ; le dénivelé et les critères de randonnée ne le filtrent pas. Les événements apparaissent également dans les lignes du tableau et les fiches. Ils appartiennent au même secteur, sans garantie de proximité avec le départ.

## Origine et limites des données

La recherche du 12 octobre 2026 a parcouru les 285 fiches de randonnée pédestre à la journée de [RandOxygène](https://randoxygene.departement06.fr/annuaire-des-randonnees?discipline%5B929%5D=929). Elle en a retenu 176 dans les secteurs demandés.

Le second catalogue, [Destination Marittime-Mercantour](https://destination.marittimemercantour.eu/), contient 160 fiches publiques. La sélection retient 50 itinéraires au départ d’une commune du 06 dans les secteurs concernés. Le rapprochement de 5 doublons sur le nom normalisé, la distance et les coordonnées de départ donne les 221 entrées affichées. Les variantes distinctes restent séparées ; d’autres recouvrements sont possibles lorsque les sources donnent des noms différents.

| Secteur | Itinéraires |
| --- | ---: |
| Tinée | 44 |
| Vésubie | 55 |
| Var | 37 |
| Roya | 43 |
| Roya / Bévéra | 23 |
| Cians | 27 |

Les secteurs se recouvrent : la somme dépasse donc le nombre total de fiches. Dans le catalogue du Mercantour, le secteur officiel « haut-Var / Cians » se répartit selon la commune de départ ; « Roya / Bévéra » se distingue de « Roya » par les départs de Moulinet et Sospel. La sélection suit celle des deux catalogues et peut inclure des parcours qui franchissent les limites du département.

Le catalogue couvre ces sources officielles, mais ne prétend pas recenser chaque sentier, variante personnelle ou itinéraire de tous les autres sites du département. Les randonnées des autres secteurs du 06, comme le littoral ou l’Estéron, ne font pas partie de cette sélection.

Les données techniques et géométries viennent des API Geotrek publiques :

- `https://geotrek.departement06.fr/api/v2/`
- `https://adminrando.marittimemercantour.eu/api/v2/`

Les durées reproduisent la durée totale publiée par chaque source. Une boucle ou un aller-retour affiche sa durée complète ; un aller simple affiche sa durée d’aller et demande d’organiser le retour. Les itinérances conservent la durée totale officielle. La page n’invente pas de découpage entre montée et descente.

Cols, sommets et lacs font l’objet d’un **repérage textuel automatique** dans le nom et le parcours officiel, en excluant l’accès routier. La fiche indique la méthode et, lorsqu’il existe, un extrait justificatif. Ce repérage reste à confirmer dans le topo. « Non renseigné » signifie que la source ne permet pas de conclure, pas que l’élément est absent. Les cols comprennent aussi les passages appelés « baisse » ou « pas ».

Les aperçus respectent la géométrie du parcours, avec le nord en haut et une projection locale approximative. Ils ne contiennent pas de fond topographique. Le profil utilise les altitudes du tracé simplifié ; les dénivelés affichés restent ceux de la source. Les aperçus servent à choisir un itinéraire, tandis que le topo officiel apporte les balises et les consignes de navigation.

L’agenda contient 12 événements ou séries de marchés, vérifiés auprès des organisateurs, des mairies ou des offices de tourisme. Chaque événement conserve sa source. Les marchés hebdomadaires se limitent à l’année 2026 ; aucune fête ne se répète automatiquement l’année suivante. Une période vide affiche « aucun événement répertorié ».

## Actualiser le catalogue

Depuis la racine du projet, avec Node.js et un accès Internet :

```sh
node scripts/collect.mjs
node scripts/collect-mercantour.mjs
node scripts/build-data.mjs
node scripts/check.mjs
node scripts/build.mjs
```

Les collecteurs téléchargent les catalogues et les fiches publiques, avec un nombre limité de requêtes simultanées. Les réponses brutes restent dans `data/research.json` et `data/mercantour-research.json`, exclus de Git. Le navigateur charge uniquement `randos/catalogue.js`.

Le premier collecteur lit le nombre total de fiches et la taille des pages dans l’annuaire, puis suit toutes les pages. Il interrompt la collecte si le nombre de fiches uniques ne correspond pas au total annoncé. Le collecteur du Mercantour suit le nombre de pages indiqué par son API.

Mettez à jour les événements dans `data/events.json` et changez `verifiedAt` après les avoir vérifiés. Chaque entrée renseigne `id`, `name`, `town`, `valleys`, `start`, `end`, `time`, `kind`, `description` et `source`. Un marché récurrent ajoute `weekday`, avec dimanche = 0, lundi = 1, jusqu’à samedi = 6. Les bornes `start` et `end` limitent la récurrence.

Après modification de l’agenda, relancez `node scripts/build-data.mjs` pour réintégrer les événements au fichier du navigateur. La dernière collecte brute doit être présente ; un nouveau clone doit donc d’abord relancer les deux collecteurs. Le déploiement GitHub utilise le catalogue déjà commité et ne dépend pas de la disponibilité des sites sources.

La page ne rafraîchit pas ses données en direct. Poussez le nouveau `randos/catalogue.js` et `data/coverage.json` sur `main` pour publier une actualisation.

## Fichiers utiles

| Fichier | Rôle |
| --- | --- |
| `randos/randos.html` | Structure de la page |
| `randos/randos.css` | Rendu ordinateur, tablette, mobile et impression |
| `randos/randos.js` | Filtres, tris, fiches, tracés et calendrier |
| `randos/catalogue.js` | Instantané des données utilisable hors ligne |
| `data/events.json` | Agenda éditable et ses sources |
| `data/coverage.json` | Périmètre de collecte et doublons rapprochés |
| `.github/workflows/pages.yml` | Publication sur GitHub Pages |

La page ne charge ni police distante, ni bibliothèque cartographique, ni outil de suivi. Elle utilise le JavaScript du navigateur et des SVG locaux.
