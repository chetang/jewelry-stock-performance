import type { InventoryRow } from "./csv-parser"

export type JobsRow = InventoryRow & {
  "Job Status": string
  "Expected Completion": string
}

export function generateJobsData(inventoryRows: InventoryRow[]): JobsRow[] {
  const jobsRows: JobsRow[] = []

  // Generate jobs for approximately 15% of inventory items
  const jobsCount = Math.floor(inventoryRows.length * 0.15)

  // Randomly select items to be in jobs
  const shuffled = [...inventoryRows].sort(() => Math.random() - 0.5)
  const selectedForJobs = shuffled.slice(0, jobsCount)

  selectedForJobs.forEach((row) => {
    // Create a job entry with a future expected completion date
    const daysUntilCompletion = Math.floor(Math.random() * 30) + 5 // 5-35 days
    const expectedDate = new Date()
    expectedDate.setDate(expectedDate.getDate() + daysUntilCompletion)

    jobsRows.push({
      ...row,
      "Job Status": "In Production",
      "Expected Completion": expectedDate.toISOString().split("T")[0],
    })
  })

  return jobsRows
}
