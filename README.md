# DNF KART - Team Analyzer

Application d'analyse de course karting en temps réel avec intégration Apex Timing.

## 🚀 Fonctionnalités

- **Analyse Live** - Suivi en temps réel via Apex Timing WebSocket
- **Page Spectateur** - Lien partageable pour suivre la course (`/spectator/:sessionId`)
- **Analyse des Stints** - Performance par pilote et relais
- **Import PDF** - Import des résultats de course
- **Gestion d'équipe** - Pilotes, poids, stratégie de lestage

## 🛠️ Stack Technique

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Database, Edge Functions)
- **Intégration**: Apex Timing WebSocket

## 📦 Installation

```bash
npm install
npm run dev
```

## 🏗️ Build Production

```bash
npm run build
npm run preview
```

## ☁️ Déploiement Railway

1. **Créer un projet Railway** et connecter le repo GitHub

2. **Ajouter les variables d'environnement** dans Railway:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

3. **Déployer** - Railway utilisera automatiquement `railway.toml`

## 📱 Page Spectateur

Pour partager le suivi de course avec vos proches:
1. Démarrer une session Live
2. Cliquer sur "Partager" pour afficher le QR code
3. L'URL `/spectator/:sessionId` est accessible sans compte

## 🔧 Variables d'Environnement

Copier `.env.example` vers `.env` et remplir:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé anonyme Supabase |
