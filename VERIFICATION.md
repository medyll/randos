# Vérification de Rando tentative

Contrôles réalisés le 12 octobre 2026 sur Chromium, avec le fuseau Europe/Paris.

Le navigateur a chargé la page sous `/rando-tentative/`, pour vérifier les chemins relatifs dans la configuration d’un site GitHub Pages de projet. Les contrôles ont également ouvert `randos/randos.html` directement depuis le disque.

## Résultats

- Catalogue : 221 identifiants uniques, six secteurs représentés, dénivelés et durées valides ; chaque fiche possède un tracé GPS.
- Recherche sans accents et combinaison vallée Tinée + dénivelé 500–999 m + lac : résultats conformes aux critères. Le filtre « à la journée » affiche 217 fiches.
- Les neuf colonnes du tableau se trient dans les deux sens, avec une entête `aria-sort` cohérente. Le menu mobile propose également les 18 options.
- Agenda : quatre rendez-vous dans la semaine du 12 au 18 octobre 2026, un le 18 octobre, deux le 24 octobre et aucun événement enregistré le 1er janvier 2027. Les marchés ne se prolongent pas au-delà de leur période enregistrée.
- Semaines : le 25 octobre 2026, malgré le changement d’heure, appartient à la période du 19 au 25 octobre ; le 1er janvier 2026 appartient à la semaine du 29 décembre 2025 au 4 janvier 2026.
- Fiches : ouverture depuis la liste, six indicateurs, carte GPS, profil d’altitude, rechargement d’un lien direct et retour conservant les filtres. La pagination passe de 1–12 à 13–24 puis revient.
- Responsive : aucun débordement horizontal à 320, 375, 390, 700, 768, 1 000, 1 024 et 1 440 px. Les filtres mobiles s’ouvrent, s’appliquent et se ferment ; la fiche mobile et son choix de date fonctionnent.

La fenêtre des sources s’ouvre et se ferme avec Échap. Le test ne signale aucune erreur JavaScript ni ressource locale manquante. Les captures ont permis de vérifier visuellement la liste sur ordinateur et mobile ainsi que les fiches dans ces deux formats.

Le script `scripts/check.mjs` a validé les données, le JavaScript et les règles `display` des éléments personnalisés. `scripts/build.mjs` produit les fichiers statiques de publication, sans installation de dépendance.

## Limites de la vérification

Le workflow GitHub Pages est prêt, mais aucun dépôt distant ni déploiement public n’a été configuré pendant cette tâche. Le test local vérifie le fonctionnement sous un préfixe de dépôt ; il ne remplace pas une exécution du workflow GitHub.

Le catalogue représente les deux sources officielles examinées, pas chaque itinéraire possible du département. Le repérage des cols, sommets et lacs reste automatique ; l’agenda est une sélection sourcée, figée à la date de vérification. Les liens principaux vers les agendas et la liste de sentiers fermés ont été contrôlés, mais les 221 téléchargements GPX/PDF n’ont pas été téléchargés individuellement.

Les captures locales se trouvent dans `preview-desktop.png`, `preview-mobile.png`, `preview-detail.png` et `preview-detail-mobile.png`. Elles restent exclues du dépôt et de la publication.
