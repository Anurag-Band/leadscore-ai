import { z } from 'zod';

// Zod schemas for validation
export const OfferSchema = z.object({
  name: z.string().min(1).max(100),
  value_props: z.array(z.string().min(1).max(200)).min(1).max(10),
  ideal_use_cases: z.array(z.string().min(1).max(200)).min(1).max(10),
  target_industries: z.array(z.string()).optional(),
  company_size: z.string().optional(),
  decision_makers: z.array(z.string()).optional(),
});

export const LeadSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  company: z.string().min(1).max(100),
  industry: z.string().optional(),
  location: z.string().optional(),
  linkedin_bio: z.string().max(1000).optional(),
});

// TypeScript types inferred from Zod schemas
export type Offer = z.infer<typeof OfferSchema> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Lead = z.infer<typeof LeadSchema> & {
  id: string;
  uploadId: string;
  createdAt: Date;
};

export type ScoringResult = {
  id: string;
  leadId: string;
  offerId: string;
  score: number;
  ruleScore: number;
  aiScore: number;
  intent: 'High' | 'Medium' | 'Low';
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  scoredAt: Date;
};
