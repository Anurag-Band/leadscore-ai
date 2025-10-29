import { Hono } from 'hono';
import offerRoutes from './offer';
import leadRoutes from './leads';
import scoringRoutes from './scoring';
// Import results routes (to be created in Phase 4)

const api = new Hono();

api.route('/offer', offerRoutes);
api.route('/leads', leadRoutes);
api.route('/score', scoringRoutes);
// api.route('/results', resultsRoutes); // Phase 4

export default api;
