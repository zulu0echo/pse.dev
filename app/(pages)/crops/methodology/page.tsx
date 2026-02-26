import { loadCriteria } from "@/lib/mandate/data-loader"
import { MethodologyWithToggle } from "./MethodologyWithToggle"

export const dynamic = "force-dynamic"

export default async function MethodologyPage() {
  const criteria = await loadCriteria()
  return <MethodologyWithToggle criteria={criteria} />
}
