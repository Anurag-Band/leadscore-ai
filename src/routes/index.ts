import { Hono } from 'hono';
import offerRoutes from './offer';
import leadRoutes from './leads';
// Import scoring and results routes (to be created in Phase 3 & 4)

const api = new Hono();

api.route('/offer', offerRoutes);
api.route('/leads', leadRoutes);
// api.route('/score', scoringRoutes);  // Phase 3
// api.route('/results', resultsRoutes); // Phase 4

export default api;
