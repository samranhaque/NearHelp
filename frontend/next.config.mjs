/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    // Remove trailing slash if present
    const cleanBackendUrl = backendUrl.replace(/\/$/, '');
    
    return [
      {
        source: '/api/:path*',
        destination: cleanBackendUrl.endsWith('/api')
          ? `${cleanBackendUrl}/:path*`
          : `${cleanBackendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;