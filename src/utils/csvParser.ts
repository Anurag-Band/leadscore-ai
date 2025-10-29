import { parse } from 'csv-parse/sync';
import { LeadSchema } from '../models/schemas';
import { sanitizeString } from './validators';

export interface ParsedLead {
  name: string;
  role: string;
  company: string;
  industry?: string;
  location?: string;
  linkedin_bio?: string;
}

export interface ParseResult {
  valid: ParsedLead[];
  invalid: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

export const parseCSV = async (fileContent: string): Promise<ParseResult> => {
  const valid: ParsedLead[] = [];
  const invalid: any[] = [];

  try {
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relaxed_quotes: true,
      skip_records_with_error: true,
    });

    // Validate each record
    records.forEach((record: any, index: number) => {
      try {
        // Sanitize all fields
        const sanitized = Object.entries(record).reduce((acc, [key, value]) => {
          acc[key] = typeof value === 'string' ? sanitizeString(value) : value;
          return acc;
        }, {} as any);

        // Validate with schema
        const validated = LeadSchema.parse(sanitized);
        valid.push(validated);
      } catch (error: any) {
        invalid.push({
          row: index + 2, // +1 for 0-index, +1 for header
          data: record,
          error: error.message || 'Validation failed',
        });
      }
    });

    return { valid, invalid };

  } catch (error: any) {
    throw new Error(`CSV parsing failed: ${error.message}`);
  }
};

// Validate CSV size and structure
export const validateCSVFile = (fileSize: number, content: string): void => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_ROWS = 10000;

  if (fileSize > MAX_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  const lineCount = content.split('\n').length;
  if (lineCount > MAX_ROWS) {
    throw new Error(`CSV exceeds ${MAX_ROWS} rows limit`);
  }
};
