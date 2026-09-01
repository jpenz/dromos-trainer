/* Public, non-secret deployment identity for release verification. */
export default function handler(_request, response) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.status(200).json({
    appVersion: "41",
    environment: process.env.VERCEL_ENV || "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF || null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    deploymentUrl: process.env.VERCEL_URL || null
  });
}
