import type { Lead, Offer } from '../../models/schemas';

export interface RuleScore {
  total: number;
  breakdown: {
    role: number;
    industry: number;
    completeness: number;
  };
  details: string[];
}

const DECISION_MAKERS = [
  'ceo', 'cto', 'cfo', 'coo', 'president',
  'vp', 'vice president', 'director', 'head of'
];

const INFLUENCERS = [
  'manager', 'lead', 'senior', 'principal', 'architect'
];

export const calculateRuleScore = (lead: Lead, offer: Offer): RuleScore => {
  const details: string[] = [];
  const breakdown = {
    role: 0,
    industry: 0,
    completeness: 0,
  };
  
  // 1. Role Relevance (20 points max)
  const roleLC = lead.role.toLowerCase();
  
  if (DECISION_MAKERS.some(title => roleLC.includes(title))) {
    breakdown.role = 20;
    details.push('Decision maker role (+20 points)');
  } else if (INFLUENCERS.some(title => roleLC.includes(title))) {
    breakdown.role = 10;
    details.push('Influencer role (+10 points)');
  } else {
    details.push('Standard role (+0 points)');
  }
  
  // 2. Industry Match (20 points max)
  if (lead.industry) {
    const industryLC = lead.industry.toLowerCase();
    const exactMatch = offer.ideal_use_cases.some(useCase => 
      industryLC.includes(useCase.toLowerCase()) || 
      useCase.toLowerCase().includes(industryLC)
    );
    
    if (exactMatch) {
      breakdown.industry = 20;
      details.push('Perfect industry match (+20 points)');
    } else if (isAdjacentIndustry(lead.industry, offer)) {
      breakdown.industry = 10;
      details.push('Adjacent industry (+10 points)');
    } else {
      details.push('Industry mismatch (+0 points)');
    }
  }
  
  // 3. Data Completeness (10 points max)
  const fields = ['name', 'role', 'company', 'industry', 'location', 'linkedin_bio'];
  const completedFields = fields.filter(field => {
    const value = (lead as any)[field];
    return value && value.toString().trim().length > 0;
  });
  
  breakdown.completeness = Math.round((completedFields.length / fields.length) * 10);
  details.push(`Data completeness: ${completedFields.length}/${fields.length} fields (+${breakdown.completeness} points)`);
  
  const total = breakdown.role + breakdown.industry + breakdown.completeness;
  
  return { total, breakdown, details };
};

// Helper function for adjacent industry detection
const isAdjacentIndustry = (leadIndustry: string, offer: Offer): boolean => {
  const adjacentMap: Record<string, string[]> = {
    'saas': ['software', 'technology', 'cloud', 'b2b'],
    'software': ['saas', 'technology', 'it', 'tech'],
    'retail': ['ecommerce', 'consumer', 'cpg'],
    'finance': ['fintech', 'banking', 'insurance'],
    'healthcare': ['healthtech', 'medical', 'pharma'],
  };
  
  const industryLC = leadIndustry.toLowerCase();
  
  // Check if any ideal use case has adjacent industries
  return offer.ideal_use_cases.some(useCase => {
    const useCaseLC = useCase.toLowerCase();
    const adjacents = adjacentMap[useCaseLC] || [];
    return adjacents.some(adj => industryLC.includes(adj));
  });
};
