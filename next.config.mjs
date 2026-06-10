/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // The v0 preview proxies the app through *.vusercontent.net. Next.js treats
  // these as cross-origin and blocks dev resources + Server Actions by default.
  allowedDevOrigins: ["*.vusercontent.net"],
  experimental: {
    serverActions: {
      allowedOrigins: ["*.vusercontent.net", "localhost:3000"],
    },
  },
}

export default nextConfig
