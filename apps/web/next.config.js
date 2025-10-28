import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'sharp'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('sharp');
    }
    return config;
  },
  async rewrites() {
    return [
      {
            source: '/uploads/:path*',
            destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
