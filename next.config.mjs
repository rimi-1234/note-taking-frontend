/** Backend origin to proxy `/api/*` to (e.g. https://note-taking-backend-rouge.vercel.app). */
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Same-origin API: the browser only talks to this site, so the refresh cookie is first-party
  // and users on networks that cannot reach the backend host directly can still sign in.
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [{ source: '/api/:path*', destination: `${apiProxyTarget}/api/:path*` }];
  },
};

export default nextConfig;
