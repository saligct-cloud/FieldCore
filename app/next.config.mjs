/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow react-pdf server-side rendering
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
}

export default nextConfig
