/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. WICHTIG: Erlaubt Next.js den statischen Export (erzeugt den 'out' Ordner)
  output: 'export',

  images: {
    // 2. WICHTIG: Deaktiviert die Bildoptimierung, da Firebase Hosting diese statisch nicht unterstützt
    unoptimized: true,
    
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;