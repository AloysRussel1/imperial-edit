/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      // Backend Django : "localhost" pour les requêtes émises par le navigateur,
      // "web" pour celles émises côté serveur à l'intérieur du réseau Docker.
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "http", hostname: "web", port: "8000" },
      // Backend Django en production (Render) — au cas où un média serait
      // servi directement depuis l'API plutôt que Cloudinary.
      { protocol: "https", hostname: "*.onrender.com" },
    ],
  },
};

module.exports = nextConfig;
