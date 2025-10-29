import type { Offer, Lead, ScoringResult } from '../models/schemas';

class MemoryStore {
  private offer: Offer | null = null;
  private leads = new Map<string, Lead>();
  private results = new Map<string, ScoringResult>();
  private uploadBatches = new Map<string, string[]>(); // uploadId -> leadIds

  // Offer methods
  setOffer(offer: Offer): void {
    this.offer = offer;
  }

  getOffer(): Offer | null {
    return this.offer;
  }

  // Lead methods
  addLeads(leads: Lead[], uploadId: string): void {
    const leadIds: string[] = [];
    leads.forEach(lead => {
      this.leads.set(lead.id, lead);
      leadIds.push(lead.id);
    });
    this.uploadBatches.set(uploadId, leadIds);
  }

  getLeads(uploadId?: string): Lead[] {
    if (uploadId) {
      const leadIds = this.uploadBatches.get(uploadId) || [];
      return leadIds.map(id => this.leads.get(id)).filter(Boolean) as Lead[];
    }
    return Array.from(this.leads.values());
  }

  // Results methods
  addResults(results: ScoringResult[]): void {
    results.forEach(result => {
      this.results.set(result.id, result);
    });
  }

  getResults(filters?: {
    uploadId?: string;
    intent?: string;
    minScore?: number;
  }): ScoringResult[] {
    let results = Array.from(this.results.values());

    if (filters?.uploadId) {
      const leadIds = this.uploadBatches.get(filters.uploadId) || [];
      results = results.filter(r => leadIds.includes(r.leadId));
    }

    if (filters?.intent) {
      results = results.filter(r => r.intent === filters.intent);
    }

    if (filters?.minScore !== undefined) {
      const minScore = filters.minScore;
      results = results.filter(r => r.score >= minScore);
    }

    return results;
  }

  // Utility methods
  clear(): void {
    this.offer = null;
    this.leads.clear();
    this.results.clear();
    this.uploadBatches.clear();
  }
}

export const store = new MemoryStore();
