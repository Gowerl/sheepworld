import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Erklärt Next.js, dass wir eine statische Seite für Firebase Hosting bauen.
     Wir aktivieren den Export nur in der Produktion, damit 'npm run dev' 
     lokal weiterhin dynamisch und schnell funktioniert.
  */
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,

  /* WICHTIG: Erzeugt für jede Route einen Ordner mit einer index.html (z.B. /job/index.html).
     Das ist die Voraussetzung dafür, dass deine Firebase-Rewrites (/job/**) 
     die richtige Datei finden.
  */
  trailingSlash: true,

  /* Deaktiviert die Standard-Bildoptimierung, da diese einen Server benötigt.
     Firebase Hosting ist rein statisch, daher müssen Bilder direkt (unoptimized)
     ausgeliefert werden.
  */
  images: {
    unoptimized: true,
  },

  /* Optionale Turbopack-Einstellungen oder andere Next.js Features 
     können hier hinzugefügt werden.
  */
};

export default nextConfig;