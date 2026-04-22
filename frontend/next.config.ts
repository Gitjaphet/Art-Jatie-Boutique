/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gmoezlcqbrfcutyxpxjw.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Au cas où tu as encore tes images de test
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
// (Note: Si ton fichier s'appelle next.config.mjs, la dernière ligne doit être `export default nextConfig;`)
