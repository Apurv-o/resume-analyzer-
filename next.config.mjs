/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep pdf-parse/mammoth (and their bundled pdfjs-dist) out of the webpack
  // server bundle — pdfjs-dist fails when webpack-bundled, so require them
  // directly from Node at runtime instead.
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth'],
  },
};

export default nextConfig;
