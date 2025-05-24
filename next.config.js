/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    
    // Configuration pour les templates
    webpack: (config) => {
      config.module.rules.push({
        test: /\.html$/,
        use: 'raw-loader',
      });
      return config;
    },
    
    // Headers de sécurité
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
          ],
        },
      ];
    },
    
    // Configuration des images - mise à jour pour pointer vers le nouveau domaine
    images: {
      domains: ['my-muqabala.fr', 'vercel.app'],
    },
  }
  
  module.exports = nextConfig