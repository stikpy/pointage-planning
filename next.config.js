/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router est activé par défaut dans Next.js 14
  
  // Configuration pour les permissions de caméra et HTTPS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=*'
          },
          
        ]
      }
    ]
  },
  
  // Configuration pour HTTPS en production
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      }
    ]
  }
}

module.exports = nextConfig
