# CROPS assessment — project GitHub repo links

Use this list to confirm the correct repo before re-running the assessment.  
Repos are taken from `content/projects/*.md` frontmatter `links.github` where the script maps project id → content file.

| # | Project ID | Name | GitHub repo URL | Source |
|---|------------|------|-----------------|--------|
| 1 | **csp** | Client-Side Proving (CSP) | https://github.com/privacy-ethereum/csp-benchmarks | client-side-proving.md |
| 2 | **tlsnotary** | TLSNotary | https://github.com/tlsnotary | tlsn.md |
| 3 | **mopro** | Mopro | https://github.com/zkmopro | mopro.md |
| 4 | **zkid** | zkID | https://github.com/privacy-scaling-explorations/zkID | zk-id.md |
| 5 | **machina** | Machina iO | https://github.com/MachinaIO/ | machina-iO.md |
| 6 | **ptr** | Private Transfers (Research) | *(none — no `links.github` in content)* | private-transactions-research.md; Sonobe is https://github.com/privacy-scaling-explorations/sonobe |
| 7 | **pte** | Private Transfers (Engineering) | *(no content file mapped)* | script has `pte: null` |
| 8 | **iptf** | IPTF | https://github.com/ethereum/iptf-map | state.json `githubRepoUrl` |
| 9 | **pir** | PIR | *(none — no `links.github` in content)* | pir-ethereum-data.md; body lists e.g. https://github.com/igor53627/rms24-rs |
| 10 | **ubt** | UBT | *(no content file mapped)* | script has `ubt: null`; verifiable-ubt.md has https://github.com/tkmct/go-ethereum/tree/test-ubt-prompt |
| 11 | **tor-js** | tor-js | https://github.com/voltrevo/arti/tree/wasm-arti-client/crates/tor-js | tor-in-js.md |

**Repos that will be used by the assessment (from content or state):**

- https://github.com/privacy-ethereum/csp-benchmarks  
- https://github.com/tlsnotary  
- https://github.com/zkmopro  
- https://github.com/privacy-scaling-explorations/zkID  
- https://github.com/MachinaIO/  
- https://github.com/ethereum/iptf-map  
- https://github.com/voltrevo/arti/tree/wasm-arti-client/crates/tor-js  

**Projects with no repo in current mapping:** ptr, pte, pir, ubt — add `links.github` in the corresponding content file or set `githubRepoUrl` in state/admin for those projects if you want them included in repo-based evidence.

After you confirm these are correct, run: `node scripts/assess-crops.js`
