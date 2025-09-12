#!/bin/bash

echo "🔄 Mise à jour de l'URL ngrok dans le code..."

# Récupérer l'URL ngrok actuelle
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | cut -d'"' -f4)

if [ -n "$NGROK_URL" ]; then
    echo "🌐 URL ngrok détectée: $NGROK_URL"
    
    # Mettre à jour le fichier secureQR.ts
    sed -i.bak "s|https://[^/]*\.ngrok-free\.app|$NGROK_URL|g" utils/secureQR.ts
    
    echo "✅ URL mise à jour dans utils/secureQR.ts"
    echo "📱 Vous pouvez maintenant générer de nouveaux QR codes avec l'URL HTTPS"
else
    echo "❌ Erreur : Impossible de récupérer l'URL ngrok"
    echo "💡 Assurez-vous que ngrok est démarré avec: ./start-https.sh"
fi
