# Homebot Integration Plan

## Current Status: Deferred

### Why Homebot Has No Open API for Individual Agents

Homebot does not publish a public API for individual real estate agents. Their API access is restricted to **partner integrations** (large brokerages, MLSs, and technology partners who sign enterprise agreements). As of 2026, there is no self-serve API key or OAuth flow available to individual agents on standard Homebot plans.

Verified by:
- Homebot's [developer documentation](https://homebot.ai) does not list any public API endpoints
- No individual agent API keys are issued through the agent dashboard
- Historical pattern: Homebot has consistently kept their data model closed to prevent raw export of homeowner engagement data

---

## Recommended Path: Weekly CSV Export

### How it works today

Homebot's agent dashboard includes a **"Contacts" export** feature that produces a CSV with:
- Contact name, email, phone
- Homebot engagement score
- Last active date
- Property address and estimated home value
- Whether they've clicked on refinance/equity/market value sections

### Manual workflow (current)

1. **Export**: Dan logs into `homebot.ai/dashboard` → Contacts → Export CSV
2. **Drop**: Save the file to a known folder: `~/Projects/thrives-daily-tracker/data/homebot-export.csv`
3. **Parse**: The `video-text-recommendations` route reads this file if present, enriches GHL recommendations with Homebot engagement signals

### CSV schema (typical Homebot export columns)

| Column | Use |
|--------|-----|
| `First Name`, `Last Name` | Match to GHL contact by name or email |
| `Email` | Primary join key to GHL contact |
| `Homebot Score` | 0–100 engagement rank |
| `Last Activity` | Date of last email open or page click |
| `Clicked Equity Section` | Boolean — high intent signal |
| `Clicked Refinance Section` | Boolean — refi interest signal |
| `Home Value Estimate` | Context for prompt personalization |

---

## Future Work: Automated Signal Integration

Once the CSV workflow is validated (targeting Q3 2026):

1. **Auto-ingest**: Add a `/api/import-homebot-csv` route or n8n workflow that watches a Google Drive folder for new CSV drops and parses them into a Supabase `homebot_signals` table
2. **Signal merger**: In `video-text-recommendations`, join GHL opportunities against `homebot_signals` by email — add a `+15` score boost for contacts with `homebotScore > 70` or `clickedEquity = true`
3. **Prompt enrichment**: When a contact has high Homebot engagement, swap in a specialized prompt template: *"{firstName}, your home at {address} has built serious equity — quick video on what that actually means for your options right now."*

### Why this matters for Dan's stack

Homebot engagement data surfaces **homeowners who are actively thinking about their equity** — the exact audience for listing conversations, HELOC referrals, and PM door acquisition. Combining Homebot's behavioral signal with GHL's pipeline stage creates a high-precision targeting layer that neither system can provide alone.
