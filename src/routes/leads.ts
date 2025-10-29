import { Hono } from 'hono';
import { store } from '../store/memoryStore';
import { APIError } from '../utils/errorHandler';
import { generateId } from '../utils/validators';
import { parseCSV, validateCSVFile } from '../utils/csvParser';
import type { Lead } from '../models/schemas';

const leadRoutes = new Hono();

leadRoutes.post('/upload', async (c) => {
  try {
    // Get file from form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new APIError('VALIDATION_ERROR', 'No file provided', 400);
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      throw new APIError('VALIDATION_ERROR', 'File must be CSV format', 400);
    }

    // Read file content
    const content = await file.text();

    // Validate file
    validateCSVFile(file.size, content);

    // Parse CSV
    const { valid, invalid } = await parseCSV(content);

    if (valid.length === 0) {
      throw new APIError('VALIDATION_ERROR', 'No valid leads found in CSV', 400, { errors: invalid });
    }

    // Create Lead objects
    const uploadId = generateId();
    const leads: Lead[] = valid.map(leadData => ({
      id: generateId(),
      uploadId,
      ...leadData,
      createdAt: new Date(),
    }));

    // Store leads
    store.addLeads(leads, uploadId);

    return c.json({
      success: true,
      uploadId,
      totalLeads: valid.length + invalid.length,
      validLeads: valid.length,
      invalidLeads: invalid.length,
      errors: invalid.length > 0 ? invalid.slice(0, 10) : undefined, // Limit errors shown
    }, 201);

  } catch (error: any) {
    if (error instanceof APIError) throw error;
    throw new APIError('PROCESSING_ERROR', error.message || 'Failed to process CSV', 400);
  }
});

leadRoutes.get('/', (c) => {
  const uploadId = c.req.query('uploadId');
  const leads = store.getLeads(uploadId);

  return c.json({
    success: true,
    total: leads.length,
    leads,
  });
});

export default leadRoutes;
