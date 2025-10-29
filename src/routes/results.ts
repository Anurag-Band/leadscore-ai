import { Hono } from 'hono';
import { store } from '../store/memoryStore';
import { APIError } from '../utils/errorHandler';

const resultsRoutes = new Hono();

resultsRoutes.get('/', (c) => {
  try {
    // Parse query parameters
    const uploadId = c.req.query('uploadId');
    const intent = c.req.query('intent') as 'High' | 'Medium' | 'Low' | undefined;
    const minScore = c.req.query('minScore') ? parseInt(c.req.query('minScore')!) : undefined;
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 100;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0;
    
    // Validate parameters
    if (intent && !['High', 'Medium', 'Low'].includes(intent)) {
      throw new APIError('VALIDATION_ERROR', 'Invalid intent value', 400);
    }
    
    if (minScore !== undefined && (minScore < 0 || minScore > 100)) {
      throw new APIError('VALIDATION_ERROR', 'minScore must be between 0 and 100', 400);
    }
    
    // Get filtered results
    let results = store.getResults({ uploadId, intent, minScore });
    
    // Get corresponding leads data
    const leads = store.getLeads();
    const leadMap = new Map(leads.map(l => [l.id, l]));
    
    // Combine results with lead data
    const enrichedResults = results.map(result => {
      const lead = leadMap.get(result.leadId);
      return {
        leadId: result.id,
        name: lead?.name || 'Unknown',
        role: lead?.role || 'Unknown',
        company: lead?.company || 'Unknown',
        industry: lead?.industry,
        location: lead?.location,
        intent: result.intent,
        score: result.score,
        ruleScore: result.ruleScore,
        aiScore: result.aiScore,
        confidence: result.confidence,
        reasoning: result.reasoning,
        keyFactors: result.keyFactors,
        scoredAt: result.scoredAt,
      };
    });
    
    // Apply pagination
    const paginated = enrichedResults.slice(offset, offset + limit);
    
    return c.json({
      success: true,
      total: enrichedResults.length,
      limit,
      offset,
      results: paginated,
    });
    
  } catch (error: any) {
    throw error;
  }
});

resultsRoutes.get('/summary', (c) => {
  const results = store.getResults();
  
  if (results.length === 0) {
    return c.json({
      success: true,
      message: 'No scoring results available',
      summary: null,
    });
  }
  
  // Calculate summary statistics
  const summary = {
    total: results.length,
    byIntent: {
      high: results.filter(r => r.intent === 'High').length,
      medium: results.filter(r => r.intent === 'Medium').length,
      low: results.filter(r => r.intent === 'Low').length,
    },
    averageScore: Math.round(
      results.reduce((sum, r) => sum + r.score, 0) / results.length
    ),
    averageConfidence: parseFloat(
      (results.reduce((sum, r) => sum + r.confidence, 0) / results.length).toFixed(2)
    ),
    scoreDistribution: {
      '0-20': results.filter(r => r.score <= 20).length,
      '21-40': results.filter(r => r.score > 20 && r.score <= 40).length,
      '41-60': results.filter(r => r.score > 40 && r.score <= 60).length,
      '61-80': results.filter(r => r.score > 60 && r.score <= 80).length,
      '81-100': results.filter(r => r.score > 80).length,
    },
  };
  
  return c.json({
    success: true,
    summary,
  });
});

resultsRoutes.get('/export', (c) => {
  try {
    const results = store.getResults();
    
    if (results.length === 0) {
      throw new APIError('NOT_FOUND', 'No results to export', 404);
    }
    
    // Get leads data
    const leads = store.getLeads();
    const leadMap = new Map(leads.map(l => [l.id, l]));
    
    // Create CSV header
    const headers = [
      'Name',
      'Role',
      'Company',
      'Industry',
      'Location',
      'Intent',
      'Score',
      'Rule Score',
      'AI Score',
      'Confidence',
      'Reasoning',
      'Key Factors',
      'Scored At'
    ];
    
    // Create CSV rows
    const rows = results.map(result => {
      const lead = leadMap.get(result.leadId);
      return [
        lead?.name || '',
        lead?.role || '',
        lead?.company || '',
        lead?.industry || '',
        lead?.location || '',
        result.intent,
        result.score.toString(),
        result.ruleScore.toString(),
        result.aiScore.toString(),
        result.confidence.toFixed(2),
        `"${result.reasoning.replace(/"/g, '""')}"`, // Escape quotes
        `"${result.keyFactors.join('; ')}"`,
        result.scoredAt.toISOString(),
      ];
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Return CSV file
    return c.text(csvContent, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="scoring-results-${Date.now()}.csv"`,
    });
    
  } catch (error: any) {
    throw error;
  }
});

// Add a JSON export option as well
resultsRoutes.get('/export/json', (c) => {
  const results = store.getResults();
  const leads = store.getLeads();
  const leadMap = new Map(leads.map(l => [l.id, l]));
  
  const exportData = results.map(result => {
    const lead = leadMap.get(result.leadId);
    return {
      lead: {
        name: lead?.name,
        role: lead?.role,
        company: lead?.company,
        industry: lead?.industry,
        location: lead?.location,
        linkedin_bio: lead?.linkedin_bio,
      },
      scoring: {
        intent: result.intent,
        totalScore: result.score,
        ruleScore: result.ruleScore,
        aiScore: result.aiScore,
        confidence: result.confidence,
      },
      analysis: {
        reasoning: result.reasoning,
        keyFactors: result.keyFactors,
      },
      metadata: {
        leadId: result.leadId,
        scoredAt: result.scoredAt,
      },
    };
  });
  
  return c.json({
    success: true,
    exportedAt: new Date().toISOString(),
    totalRecords: exportData.length,
    data: exportData,
  });
});

export default resultsRoutes;
