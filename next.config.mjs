/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  pageExtensions: ["ts", "tsx"],
  
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
