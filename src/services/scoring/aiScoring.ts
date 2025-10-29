import OpenAI from 'openai';
import type { Lead, Offer } from '../../models/schemas';
import { APIError } from '../../utils/errorHandler';
import { sanitizeString } from '../../utils/validators';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIScore {
  score: number;
  intent: 'High' | 'Medium' | 'Low';
  confidence: number;
  reasoning: string;
  keyFactors: string[];
}

export const calculateAIScore = async (lead: Lead, offer: Offer): Promise<AIScore> => {
  const prompt = buildCoTPrompt(lead, offer);
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert lead qualification specialist. Analyze prospects using structured reasoning and provide JSON responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent scoring
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });
    
    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('Empty AI response');
    }
    
    // Parse and validate AI response
    const parsed = JSON.parse(response);
    const validated = validateAIResponse(parsed);
    
    // Calculate score based on intent and confidence
    const baseScore = {
      'High': 50,
      'Medium': 30,
      'Low': 10
    }[validated.intent];
    
    // Apply confidence multiplier
    const score = Math.round(baseScore * validated.confidence);
    
    return {
      score,
      intent: validated.intent,
      confidence: validated.confidence,
      reasoning: sanitizeString(validated.reasoning),
      keyFactors: validated.keyFactors.map(sanitizeString),
    };
    
  } catch (error: any) {
    console.error('AI Scoring Error:', error);
    
    // Fallback scoring based on basic heuristics
    return {
      score: 25,
      intent: 'Medium',
      confidence: 0.5,
      reasoning: 'AI analysis unavailable, using fallback scoring',
      keyFactors: ['Fallback scoring applied'],
    };
  }
};

const buildCoTPrompt = (lead: Lead, offer: Offer): string => {
  return `Analyze this sales prospect using Chain of Thought reasoning.

## Offer Details
Product: ${offer.name}
Value Propositions: ${offer.value_props.join(', ')}
Ideal Use Cases: ${offer.ideal_use_cases.join(', ')}

## Prospect Information
Name: ${lead.name}
Role: ${lead.role}
Company: ${lead.company}
Industry: ${lead.industry || 'Not specified'}
Location: ${lead.location || 'Not specified'}
LinkedIn Bio: ${lead.linkedin_bio || 'Not provided'}

## Step-by-Step Analysis

Please think through these factors:

1. **Decision Authority**: Analyze the role title to determine if this person has budget authority or influence over purchasing decisions. Consider seniority level and department.

2. **Company-Offer Fit**: Evaluate how well the company aligns with our ideal customer profile. Consider:
   - Industry alignment
   - Likely company size based on available information
   - Potential use cases for our product

3. **Pain Point Indicators**: Based on the role and company context, identify potential pain points our product addresses:
   - What challenges might someone in this role face?
   - How does our value proposition solve these challenges?

4. **Buying Signals**: Look for any indicators of active interest or timing:
   - Keywords in their bio suggesting transformation or change
   - Role indicators suggesting they're responsible for improvements
   - Industry trends that might drive urgency

5. **Risk Factors**: Identify any red flags or misalignments:
   - Role too junior/senior
   - Industry mismatch
   - Geographic limitations

## Required Output

Based on your analysis, provide a JSON response with this exact structure:
{
  "intent": "High|Medium|Low",
  "confidence": 0.0-1.0,
  "reasoning": "A 2-3 sentence explanation of your scoring decision, focusing on the most important factors",
  "keyFactors": ["factor1", "factor2", "factor3"]
}

Intent Definitions:
- High: Strong ICP fit, decision maker, clear pain points
- Medium: Partial ICP fit or influencer role, potential pain points
- Low: Poor ICP fit, unclear role relevance, or missing key criteria`;
};

const validateAIResponse = (response: any): {
  intent: 'High' | 'Medium' | 'Low';
  confidence: number;
  reasoning: string;
  keyFactors: string[];
} => {
  // Validate intent
  if (!['High', 'Medium', 'Low'].includes(response.intent)) {
    throw new Error('Invalid intent value');
  }
  
  // Validate confidence
  const confidence = parseFloat(response.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    throw new Error('Invalid confidence value');
  }
  
  // Validate reasoning
  if (!response.reasoning || typeof response.reasoning !== 'string') {
    throw new Error('Invalid reasoning');
  }
  
  // Validate keyFactors
  if (!Array.isArray(response.keyFactors) || response.keyFactors.length === 0) {
    throw new Error('Invalid keyFactors');
  }
  
  return {
    intent: response.intent as 'High' | 'Medium' | 'Low',
    confidence,
    reasoning: response.reasoning.substring(0, 500), // Limit length
    keyFactors: response.keyFactors.slice(0, 5).map((f: any) => String(f).substring(0, 100)),
  };
};
