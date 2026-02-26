/**
 * Map CROPS state.json project id to PSE.dev project page slug (content/projects filename).
 * Used to link from CROPS assessment pages to the project page on pse.dev.
 */
export const PROJECT_ID_TO_PSE_SLUG: Record<string, string | null> = {
  csp: "client-side-proving",
  tlsnotary: "tlsn",
  mopro: "mopro",
  zkid: "zk-id",
  machina: "machina-iO",
  ptr: "private-transactions-research",
  pte: null,
  iptf: null,
  pir: "pir-ethereum-data",
  ubt: null,
  "tor-js": "tor-in-js",
}

export function getPseProjectPageUrl(projectId: string, baseUrl: string): string | null {
  const slug = PROJECT_ID_TO_PSE_SLUG[projectId]
  if (!slug) return null
  const base = baseUrl.replace(/\/$/, "")
  return `${base}/projects/${slug}`
}
