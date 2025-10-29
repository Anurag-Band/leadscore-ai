import { Hono } from 'hono';
import offerRoutes from './offer';
import leadRoutes from './leads';
import scoringRoutes from './scoring';
import resultsRoutes from './results';

const api = new Hono();

// Add request logging middleware
api.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const end = Date.now();
  console.log(`${c.req.method} ${c.req.path} - ${c.res.status} (${end - start}ms)`);
});

// Mount routes
api.route('/offer', offerRoutes);
api.route('/leads', leadRoutes);
api.route('/score', scoringRoutes);
api.route('/results', resultsRoutes);

// API documentation endpoint
api.get('/', (c) => {
  return c.json({
    name: 'Lead Scoring API',
    version: '1.0.0',
    endpoints: {
      offer: {
        'POST /offer': 'Create/update offer',
        'GET /offer': 'Get current offer',
      },
      leads: {
        'POST /leads/upload': 'Upload CSV of leads',
        'GET /leads': 'Get uploaded leads',
      },
      scoring: {
        'POST /score': 'Start scoring pipeline',
        'GET /score/status': 'Get scoring status',
      },
      results: {
        'GET /results': 'Get scoring results',
        'GET /results/summary': 'Get results summary',
        'GET /results/export': 'Export results as CSV',
        'GET /results/export/json': 'Export results as JSON',
      },
    },
  });
});

export default api;
