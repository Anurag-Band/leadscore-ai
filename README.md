# 🎯 Lead Scoring AI Backend

**Intelligent lead scoring API combining rule-based algorithms with GPT-4o Chain-of-Thought reasoning.**

Built with: `Bun` • `Hono.js` • `TypeScript` • `OpenAI GPT-4o` • `Zod`

---

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Add your OPENAI_API_KEY to .env

# Start server
bun run dev
```

Server runs on `http://localhost:3000`

---

## ✨ Key Features

✅ **Hybrid Scoring** - Rule-based (50pts) + AI analysis (50pts) = 0-100 score  
✅ **Chain of Thought** - GPT-4o with structured 5-step reasoning  
✅ **CSV Upload** - Bulk import with validation (up to 10k leads)  
✅ **Async Processing** - Batch scoring with progress tracking  
✅ **Export Ready** - CSV and JSON export options  
✅ **Production Grade** - Full error handling, sanitization, Dockerized

---

## � API Workflow

```bash
# 1. Define your product/offer
POST /offer
{
  "name": "AI Sales Platform",
  "value_props": ["Automate outreach", "6x meetings"],
  "ideal_use_cases": ["B2B SaaS", "mid-market"]
}

# 2. Upload leads CSV
POST /leads/upload
# CSV: name, role, company, industry, location, linkedin_bio

# 3. Start scoring
POST /score

# 4. Check progress
GET /score/status

# 5. Get results
GET /results?intent=High&minScore=70

# 6. Export
GET /results/export          # CSV
GET /results/export/json     # JSON
```

### Complete API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/` | GET | API documentation |
| `/offer` | POST | Create offer |
| `/offer` | GET | Get current offer |
| `/leads/upload` | POST | Upload CSV file |
| `/leads` | GET | Get uploaded leads |
| `/score` | POST | Start scoring |
| `/score/status` | GET | Check progress |
| `/results` | GET | Get scored results |
| `/results/summary` | GET | Get statistics |
| `/results/export` | GET | Export as CSV |
| `/results/export/json` | GET | Export as JSON |

## 🧮 Scoring Algorithm

**Total Score = Rule-Based (50pts) + AI Analysis (50pts)**

### Rule-Based Scoring (0-50 points)

| Factor | Points | Criteria |
|--------|--------|----------|
| **Role** | 20 | Decision Maker (CEO, VP, Director) |
| | 10 | Influencer (Manager, Senior, Lead) |
| | 0 | Other roles |
| **Industry** | 20 | Exact ICP match |
| | 10 | Adjacent industry |
| | 0 | No match |
| **Completeness** | 10 | Based on filled fields (6 total) |

### AI Scoring (0-50 points)

**GPT-4o Chain of Thought Analysis:**
1. Decision authority assessment
2. Company-offer fit evaluation
3. Pain point alignment
4. Buying signals detection
5. Risk factor identification

**Score Calculation:**
- High Intent: 50pts × confidence
- Medium Intent: 30pts × confidence  
- Low Intent: 10pts × confidence

**Final Intent:** High (≥70) | Medium (40-69) | Low (<40)

## � Project Structure

```
src/
├── index.ts                    # Server entry point
├── routes/                     # API endpoints
│   ├── offer.ts               # Offer management
│   ├── leads.ts               # CSV upload
│   ├── scoring.ts             # Scoring pipeline
│   └── results.ts             # Results & export
├── services/scoring/          # Scoring engine
│   ├── ruleEngine.ts          # Rule-based logic
│   ├── aiScoring.ts           # GPT-4o integration
│   └── pipeline.ts            # Orchestration
├── models/schemas.ts          # Zod validation
├── utils/                     # Helpers
└── store/memoryStore.ts       # In-memory DB
```

## � Docker Deployment

```bash
docker build -t leadscore-ai .
docker run -p 3000:3000 -e OPENAI_API_KEY=sk-... leadscore-ai
```

## 🚀 Cloud Deployment

**Railway / Render / Fly.io**
1. Connect GitHub repository
2. Set environment variable: `OPENAI_API_KEY`
3. Deploy (auto-detected Bun setup)

## 📊 Performance & Security

**Performance:**
- ~1-2 sec per lead
- 5 concurrent batch processing
- Up to 10k leads/upload

**Security:**
- ✅ Zod schema validation
- ✅ XSS/SQL injection protection
- ✅ Sanitized AI responses
- ✅ No PII logging

## 💡 Example Response

```json
{
  "name": "Sarah Chen",
  "role": "VP Sales",
  "company": "CloudScale Inc",
  "intent": "High",
  "score": 88,
  "reasoning": "VP Sales at SaaS company - perfect ICP match with decision-making authority",
  "keyFactors": ["Decision maker", "Industry match", "Sales transformation focus"]
}
```

---

## 👤 Author

**Anurag Band** • [GitHub](https://github.com/Anurag-Band) • [Repository](https://github.com/Anurag-Band/leadscore-ai)

---

*Built with Bun, Hono.js, TypeScript, and GPT-4o*

