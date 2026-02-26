import { readFile } from "fs/promises"
import path from "path"
import { existsSync } from "fs"
import { criteriaRegistrySchema, stateSchema } from "./schemas"
import type { CriteriaRegistry, MandateState } from "./schemas"

function getDataDir(): string {
  const cwd = process.cwd()
  const candidates = [
    path.join(cwd, "data"),
    path.join(cwd, "..", "data"),
  ]
  for (const dir of candidates) {
    if (existsSync(path.join(dir, "criteria.json")) && existsSync(path.join(dir, "state.json"))) {
      return dir
    }
  }
  return candidates[0]
}

const DATA_DIR = getDataDir()

export async function loadCriteria(): Promise<CriteriaRegistry> {
  const filePath = path.join(DATA_DIR, "criteria.json")
  try {
    const raw = await readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw) as unknown
    return criteriaRegistrySchema.parse(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Failed to load criteria from ${filePath}: ${message}. Ensure data/criteria.json exists and is valid JSON matching the schema.`
    )
  }
}

export async function loadState(): Promise<MandateState> {
  const filePath = path.join(DATA_DIR, "state.json")
  try {
    const raw = await readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw) as unknown
    return stateSchema.parse(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Failed to load state from ${filePath}: ${message}. Ensure data/state.json exists and is valid JSON matching the schema.`
    )
  }
}
