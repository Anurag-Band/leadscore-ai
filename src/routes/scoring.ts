import { Hono } from 'hono';
import { scoreAllLeads } from '../services/scoring/pipeline';
import { APIError } from '../utils/errorHandler';

const scoringRoutes = new Hono();

// Store scoring status in memory
let scoringStatus: any = null;

scoringRoutes.post('/', async (c) => {
  try {
    // Check if scoring is already in progress
    if (scoringStatus?.status === 'processing') {
      throw new APIError('CONFLICT', 'Scoring already in progress', 409);
    }
    
    // Reset status
    scoringStatus = {
      status: 'processing',
      startedAt: new Date(),
      progress: { total: 0, processed: 0 }
    };
    
    // Start scoring (don't await - let it run async)
    scoreAllLeads((progress) => {
      scoringStatus.progress = progress;
    }).then(result => {
      scoringStatus = {
        ...scoringStatus,
        status: 'completed',
        completedAt: new Date(),
        summary: {
          total: result.results.length,
          errors: result.errors.length,
          high: result.results.filter(r => r.intent === 'High').length,
          medium: result.results.filter(r => r.intent === 'Medium').length,
          low: result.results.filter(r => r.intent === 'Low').length,
        }
      };
    }).catch(error => {
      scoringStatus = {
        ...scoringStatus,
        status: 'failed',
        error: error.message,
      };
    });
    
    return c.json({
      success: true,
      message: 'Scoring pipeline started',
      statusUrl: '/score/status',
    }, 202);
    
  } catch (error: any) {
    throw error;
  }
});

scoringRoutes.get('/status', (c) => {
  if (!scoringStatus) {
    return c.json({
      success: true,
      status: 'idle',
      message: 'No scoring operation has been initiated',
    });
  }
  
  return c.json({
    success: true,
    ...scoringStatus,
  });
});

export default scoringRoutes;
