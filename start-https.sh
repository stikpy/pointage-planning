#!/bin/bash

echo "🚀 Démarrage du serveur Next.js avec HTTPS pour iOS..."
echo ""

# Démarrer Next.js en arrière-plan
echo "1. Démarrage du serveur Next.js..."
HOST=0.0.0.0 PORT=3000 npm run dev &
NEXTJS_PID=$!

# Attendre que le serveur démarre
sleep 5

# Démarrer ngrok pour créer un tunnel HTTPS
echo "2. Création du tunnel HTTPS avec ngrok..."
ngrok http 3000 --log=stdout &
NGROK_PID=$!

# Attendre que ngrok démarre
sleep 3

# Récupérer l'URL publique HTTPS
echo "3. Récupération de l'URL publique..."
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | cut -d'"' -f4)

if [ -n "$NGROK_URL" ]; then
    echo ""
    echo "✅ Serveur HTTPS disponible !"
    echo "🌐 URL publique: $NGROK_URL"
    echo ""
    echo "📱 Pour iOS : Utilisez cette URL dans les QR codes"
    echo "🔧 Pour modifier l'URL : Éditez utils/secureQR.ts"
    echo ""
    echo "Appuyez sur Ctrl+C pour arrêter les serveurs"
else
    echo "❌ Erreur : Impossible de récupérer l'URL ngrok"
    kill $NEXTJS_PID $NGROK_PID 2>/dev/null
    exit 1
fi

# Fonction de nettoyage
cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs..."
    kill $NEXTJS_PID $NGROK_PID 2>/dev/null
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT

# Attendre indéfiniment
wait
