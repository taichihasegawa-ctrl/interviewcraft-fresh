/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    return Date.now().toString()
  },
}

module.exports = nextConfig
