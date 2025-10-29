#!/bin/bash

# Test script for Phase 2, 3, and 4 implementation
BASE_URL="http://localhost:3000"

echo "================================"
echo "LeadScore AI - API Test Suite"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
curl -s $BASE_URL/health | head -5
echo ""
echo ""

# Test 2: API Documentation
echo -e "${YELLOW}Test 2: API Documentation${NC}"
curl -s $BASE_URL/ | head -20
echo ""
echo ""

# Test 3: Create Offer
echo -e "${YELLOW}Test 3: Create Offer${NC}"
curl -s -X POST $BASE_URL/offer \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enterprise CRM Solution",
    "value_props": [
      "Streamline customer relationships",
      "Automate sales workflows",
      "AI-powered insights"
    ],
    "ideal_use_cases": [
      "SaaS",
      "Technology",
      "B2B Sales"
    ]
  }'
echo ""
echo ""

# Test 4: Get Offer
echo -e "${YELLOW}Test 4: Get Offer${NC}"
curl -s $BASE_URL/offer
echo ""
echo ""

# Test 5: Upload Leads CSV
echo -e "${YELLOW}Test 5: Upload Leads CSV${NC}"
curl -s -X POST $BASE_URL/leads/upload \
  -F "file=@test.csv"
echo ""
echo ""

# Test 6: Get Leads
echo -e "${YELLOW}Test 6: Get Leads${NC}"
curl -s $BASE_URL/leads
echo ""
echo ""

# Test 7: Start Scoring
echo -e "${YELLOW}Test 7: Start Scoring Pipeline${NC}"
curl -s -X POST $BASE_URL/score
echo ""
echo ""

# Wait for scoring to complete
echo -e "${YELLOW}Waiting 5 seconds for scoring to complete...${NC}"
sleep 5
echo ""

# Test 8: Check Scoring Status
echo -e "${YELLOW}Test 8: Check Scoring Status${NC}"
curl -s $BASE_URL/score/status
echo ""
echo ""

# Test 9: Get Results
echo -e "${YELLOW}Test 9: Get Results${NC}"
curl -s $BASE_URL/results
echo ""
echo ""

# Test 10: Get Results Summary
echo -e "${YELLOW}Test 10: Get Results Summary${NC}"
curl -s $BASE_URL/results/summary
echo ""
echo ""

# Test 11: Filter High Intent Leads
echo -e "${YELLOW}Test 11: Filter High Intent Leads${NC}"
curl -s "$BASE_URL/results?intent=High"
echo ""
echo ""

# Test 12: Export as JSON
echo -e "${YELLOW}Test 12: Export Results as JSON${NC}"
curl -s $BASE_URL/results/export/json | head -30
echo ""
echo ""

# Test 13: Export as CSV (save to file)
echo -e "${YELLOW}Test 13: Export Results as CSV${NC}"
curl -s $BASE_URL/results/export -o test-results.csv
if [ -f test-results.csv ]; then
  echo -e "${GREEN}✓ CSV file exported successfully${NC}"
  head -5 test-results.csv
  echo ""
else
  echo -e "${RED}✗ CSV export failed${NC}"
fi
echo ""

echo "================================"
echo -e "${GREEN}Test Suite Completed!${NC}"
echo "================================"
