/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingIncludes: {
      '/api/bot': ['./data/**/*'],
    },
};

module.exports = nextConfig;
