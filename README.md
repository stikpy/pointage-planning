# Pointage & Planning

Application de gestion des horaires et planning avec système de pointage sécurisé par QR code.

## 🚀 Fonctionnalités

- **Pointage sécurisé** : QR codes avec validation cryptographique
- **Vérification d'identité** : PIN code + horaires de travail
- **Prise de photo** : Horodatage automatique et filigrane de sécurité
- **Gestion des employés** : Création, modification, codes PIN
- **Planning** : Gestion des horaires et plannings
- **PWA** : Application web progressive pour mobile
- **Résistance aux coupures** : Sauvegarde automatique et récupération

## 🛠️ Technologies

- **Next.js 14** avec App Router
- **TypeScript** pour la sécurité des types
- **React** avec hooks modernes
- **PWA** avec manifest et service worker
- **QR Code** : Génération et scan sécurisés
- **Camera API** : Prise de photo avec horodatage
- **LocalStorage** : Persistance des données

## 📱 Installation

```bash
# Cloner le repository
git clone <url-du-repo>
cd pointage-planning

# Installer les dépendances
npm install

# Démarrer en développement
npm run dev

# Build de production
npm run build
npm start
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env.local` :

```env
# URL de base pour les QR codes
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
```

### HTTPS pour la caméra

Pour utiliser la caméra sur mobile, l'application doit être servie en HTTPS :

```bash
# Avec ngrok (développement)
npx ngrok http 3000

# Ou avec Vercel (production)
vercel --prod
```

## 📋 Utilisation

### 1. Gestion des employés
- Créer des employés avec codes PIN
- Définir les horaires de travail
- Gérer les rôles (manager/employé)

### 2. Pointage
- Scanner le QR code généré
- Saisir le code PIN
- Prendre une photo de vérification
- Validation automatique

### 3. Planning
- Visualiser les pointages
- Gérer les horaires
- Exporter les données

## 🔒 Sécurité

- **QR codes signés** : Validation cryptographique
- **Sessions limitées** : Expiration automatique
- **Vérification d'identité** : PIN + horaires
- **Photos horodatées** : Preuve de présence
- **HTTPS obligatoire** : Pour l'accès caméra

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Déployer en production
vercel --prod
```

### Autres plateformes

L'application est compatible avec :
- Vercel
- Netlify
- Railway
- Heroku
- Docker

## 📱 PWA

L'application est installable sur mobile :
- Ajouter à l'écran d'accueil
- Fonctionne hors ligne (données locales)
- Interface native

## 🔧 Développement

### Structure du projet

```
├── app/                    # App Router Next.js
│   ├── clock/[employeeId]/ # Page de pointage
│   └── test-clock/         # Page de test
├── components/             # Composants React
│   ├── IdentityVerification.tsx
│   ├── PhotoCapture.tsx
│   └── QRCodeManager.tsx
├── utils/                  # Utilitaires
│   └── secureQR.ts        # Gestion QR sécurisés
└── types/                  # Types TypeScript
    └── index.ts
```

### Scripts disponibles

```bash
npm run dev      # Développement
npm run build    # Build production
npm run start    # Serveur production
npm run lint     # Linting
```

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir une issue
- Proposer une pull request
- Améliorer la documentation

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation
- Tester avec la page `/test-clock`
