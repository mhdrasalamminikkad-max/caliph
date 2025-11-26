/**
 * PDF Sanitization - Removes potentially problematic content that could trigger antivirus
 */

export function sanitizeForPDF(text: string): string {
  if (!text) return "";
  
  // Convert to string if needed
  let sanitized = String(text);
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  
  // Remove potentially problematic PDF injection characters
  sanitized = sanitized.replace(/[<>{}[\]]/g, "");
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to prevent buffer issues
  sanitized = sanitized.substring(0, 500);
  
  return sanitized;
}

export function sanitizeForPDFTable(records: any[]): any[] {
  return records.map(record => {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === "string") {
        sanitized[key] = sanitizeForPDF(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  });
}
