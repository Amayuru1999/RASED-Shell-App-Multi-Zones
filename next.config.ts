import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    externalDir: true,
  },
  transpilePackages: ['rased-shared-ui'],
  async rewrites() {
    return {
      afterFiles: [
        // User Management Zone
        {
          source: '/users/:path*',
          destination:
            process.env.USER_MANAGEMENT_URL
              ? `${process.env.USER_MANAGEMENT_URL}/users/:path*`
              : 'http://localhost:3001/users/:path*',
        },
        // License Management Zone
        {
          source: '/licenses/:path*',
          destination:
            process.env.LICENSE_MANAGEMENT_URL
              ? `${process.env.LICENSE_MANAGEMENT_URL}/licenses/:path*`
              : 'http://localhost:3002/licenses/:path*',
        },
        // Production Management Zone
        {
          source: '/production/:path*',
          destination:
            process.env.PRODUCTION_MANAGEMENT_URL
              ? `${process.env.PRODUCTION_MANAGEMENT_URL}/production/:path*`
              : 'http://localhost:3003/production/:path*',
        },
        // Reporting Zone
        {
          source: '/reports/:path*',
          destination:
            process.env.REPORTING_MANAGEMENT_URL
              ? `${process.env.REPORTING_MANAGEMENT_URL}/reports/:path*`
              : 'http://localhost:3004/reports/:path*',
        },
      ],
    }
  },
}

export default nextConfig
