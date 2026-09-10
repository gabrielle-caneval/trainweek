# TrainWeek

Application personnelle de suivi des entraînements, construite avec Next.js, React et TypeScript.

## Fonctionnalités présentes dans le code

- Programme hebdomadaire et personnalisation des exercices.
- Journal des séances, suivi du poids et des records personnels.
- Tableaux de bord, graphiques de progression et bilan.
- Pages nutrition et coach conversationnel.
- Conversation et génération de programme via Groq avec une clé personnelle.
- Thème clair/sombre, interface mobile et manifeste PWA.

## Lancement

Node.js 20.9+ et npm sont nécessaires.

```sh
npm ci
npm run dev
```

Ouvrir http://localhost:3000. La création du profil est locale : elle ne correspond pas à une authentification serveur.

```sh
npm run build
npm start
```

Le build utilise Webpack. Les fonctionnalités de suivi ne nécessitent pas de serveur de base de données.

## Données et limites

Les profils, programmes, séances, poids et records sont sauvegardés dans le localStorage du navigateur, sans synchronisation entre appareils. Effacer les données du navigateur efface cette sauvegarde.

Le coach appelle directement Groq depuis le navigateur avec la clé saisie par l’utilisateur. Cette version conserve aussi cette clé dans le localStorage : elle est destinée à une utilisation personnelle sur un appareil de confiance. Aucune clé n’est incluse dans le dépôt. Les messages et le contexte inclus dans les requêtes sont transmis à Groq ; les appels peuvent consommer le quota du compte. Pour un service public avec une clé partagée, une API serveur et des contrôles d’accès seraient nécessaires.

Les conseils et programmes générés ne sont pas validés médicalement. Le fonctionnement du service IA dépend du compte, du réseau et de la disponibilité du modèle. Le service worker propose une mise en cache ; le fonctionnement hors ligne complet n’est pas garanti.

## Illustrations

Le code référence des images externes, notamment Docteur Fitness et Unsplash. Les copies locales redondantes de ces médias ne sont pas redistribuées ici. Les médias restent soumis aux droits de leurs auteurs et à la disponibilité de leurs hébergeurs.

## Droits

Code rendu consultable pour présentation du projet. Aucune licence de réutilisation n’est accordée. Les dépendances restent soumises à leurs propres licences.
