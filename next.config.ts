const nextConfig = {
  output: 'standalone',
  images: {
      remotePatterns: [
          {
              protocol: 'https',
              hostname: 'lh3.googleusercontent.com',
          },
      ],
  },
  experimental: {
      serverActions: {
        allowedOrigins: [
          'localhost:3000', // Allow local development
          '38zswbng-3000.inc1.devtunnels.ms', // Specific tunnel URL
          '*.inc1.devtunnels.ms', // Wildcard for dynamic devtunnels.ms subdomains
        ],
      },
    }
};

export default nextConfig;