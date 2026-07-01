// Dev proxy: forwards /api/* to the Logik headless API and injects the auth
// token + Origin server-side, so the token never ships to the browser. CRA
// loads this file automatically when running `npm start`.
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const base = process.env.LOGIK_API_BASE || 'https://es-test-headless.test.logik.io';
  const token = process.env.LOGIK_AUTH_TOKEN;
  // The API validates Origin. It usually matches the base host, so default to it;
  // override with LOGIK_ORIGIN only when the tenant expects a different value.
  const origin = process.env.LOGIK_ORIGIN || base;

  if (!token) {
    console.warn(
      '\n[setupProxy] LOGIK_AUTH_TOKEN is not set — API calls will be unauthorized.\n' +
      'Add it to a .env file in the project root (see .env.example).\n'
    );
  }

  app.use(
    '/api',
    createProxyMiddleware({
      // Express strips the '/api' mount prefix, so include it in the target to
      // forward to <base>/api/* (not <base>/*, which is a different auth realm).
      target: `${base}/api`,
      changeOrigin: true,
      on: {
        proxyReq: (proxyReq) => {
          proxyReq.setHeader('Authorization', `Bearer ${token}`);
          // The Logik API rejects requests with no Origin header (403). The dev
          // server proxies same-origin, so the browser sends none — inject one.
          proxyReq.setHeader('Origin', origin);
        },
      },
    })
  );
};
