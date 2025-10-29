import { store } from '../../store/memoryStore';
import { calculateRuleScore } from './ruleEngine';
import { calculateAIScore } from './aiScoring';
import type { ScoringResult, Lead, Offer } from '../../models/schemas';
import { generateId } from '../../utils/validators';
import { APIError } from '../../utils/errorHandler';

export interface ScoringProgress {
  total: number;
  processed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
}

export const scoreLead = async (lead: Lead, offer: Offer): Promise<ScoringResult> => {
  // Calculate rule-based score
  const ruleResult = calculateRuleScore(lead, offer);
  
  // Calculate AI score
  const aiResult = await calculateAIScore(lead, offer);
  
  // Calculate final score
  const finalScore = Math.min(100, ruleResult.total + aiResult.score);
  
  // Determine final intent based on combined score
  const finalIntent = finalScore >= 70 ? 'High' : 
                     finalScore >= 40 ? 'Medium' : 'Low';
  
  const result: ScoringResult = {
    id: generateId(),
    leadId: lead.id,
    offerId: offer.id,
    score: finalScore,
    ruleScore: ruleResult.total,
    aiScore: aiResult.score,
    intent: finalIntent,
    confidence: aiResult.confidence,
    reasoning: aiResult.reasoning,
    keyFactors: aiResult.keyFactors,
    scoredAt: new Date(),
  };
  
  return result;
};

export const scoreAllLeads = async (onProgress?: (progress: ScoringProgress) => void): Promise<{
  success: boolean;
  results: ScoringResult[];
  errors: any[];
}> => {
  const offer = store.getOffer();
  if (!offer) {
    throw new APIError('NOT_FOUND', 'No offer configured', 404);
  }
  
  const leads = store.getLeads();
  if (leads.length === 0) {
    throw new APIError('NOT_FOUND', 'No leads to score', 404);
  }
  
  const progress: ScoringProgress = {
    total: leads.length,
    processed: 0,
    status: 'processing',
    startedAt: new Date(),
  };
  
  const results: ScoringResult[] = [];
  const errors: any[] = [];
  const BATCH_SIZE = 5; // Process 5 leads concurrently
  
  try {
    // Process leads in batches
    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (lead) => {
        try {
          const result = await scoreLead(lead, offer);
          results.push(result);
          progress.processed++;
          
          if (onProgress) {
            onProgress(progress);
          }
          
          return result;
        } catch (error: any) {
          errors.push({
            leadId: lead.id,
            leadName: lead.name,
            error: error.message,
          });
          progress.processed++;
          return null;
        }
      });
      
      await Promise.all(batchPromises);
    }
    
    // Store results
    store.addResults(results);
    
    progress.status = 'completed';
    progress.completedAt = new Date();
    
    return {
      success: true,
      results,
      errors,
    };
    
  } catch (error: any) {
    progress.status = 'failed';
    throw new APIError('SCORING_ERROR', `Scoring pipeline failed: ${error.message}`, 500);
  }
};
