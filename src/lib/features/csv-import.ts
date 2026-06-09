export function isCsvImportEnabled(): boolean {
  return process.env.ENABLE_CSV_IMPORT === "true";
}
