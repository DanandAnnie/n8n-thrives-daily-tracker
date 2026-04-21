import { NextRequest, NextResponse } from "next/server";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

// Stage ID → { display name, priority weight, prompt template key }
const STAGE_MAP: Record<string, { name: string; weight: number; tpl: string }> = {
  // Pre Listing (weight 100)
  "ff57ba8b-0034-4e78-8a9f-3d3548e5e665": { name: "Pre Listing", weight: 100, tpl: "pre-listing" },
  "29783844-49e1-4ad3-9c8d-12d647b37550": { name: "Pre Listing", weight: 100, tpl: "pre-listing" },
  "ab154660-4d07-4e89-946f-3c93de42dacb": { name: "Pre Listing", weight: 100, tpl: "pre-listing" },
  "83f71492-d1fd-48d0-9e3d-4555aa398578": { name: "Pre Listing", weight: 100, tpl: "pre-listing" },
  "7567655e-15fd-4e1b-bc41-9549269d83e4": { name: "Pre Listing", weight: 100, tpl: "pre-listing" },
  "65409937-d123-4bf7-9659-47c0d1e33e72": { name: "Pre Listing", weight: 100, tpl: "pre-listing" },
  "eb944fe1-2adb-4b47-a31b-39b73c20f55c": { name: "Pre Listing", weight: 100, tpl: "pre-listing" },
  "2c4aac48-dedb-4c2c-b535-70ed383abc93": { name: "Pre Listing", weight: 100, tpl: "pre-listing" },
  // Listing Appointment (weight 90)
  "80c55039-893b-4a68-b759-0891d79ddcda": { name: "Listing Appointment", weight: 90, tpl: "listing-appt" },
  "fbf6c4a0-5090-40fa-bbe8-396c18127f61": { name: "Listing Appointment", weight: 90, tpl: "listing-appt" },
  "b025add1-c606-477a-a639-cfb385f0687e": { name: "Listing Appointment", weight: 90, tpl: "listing-appt" },
  "5e9333e7-11bd-4c7b-87d5-277d84102a3a": { name: "Listing Appointment", weight: 90, tpl: "listing-appt" },
  "bbedff68-a831-46b9-8f5e-a206889f2839": { name: "Listing Appointment", weight: 90, tpl: "listing-appt" },
  "00977ff4-65e9-40f3-88f3-1f38e6561bca": { name: "Listing Appointment", weight: 90, tpl: "listing-appt" },
  "fe9124e6-1335-490b-8499-80b54e5a3cbb": { name: "Listing Appointment", weight: 90, tpl: "listing-appt" },
  "af8dc10a-d058-4c20-a50f-fc01c02c9e40": { name: "Listing Appointment", weight: 90, tpl: "listing-appt" },
  "61d22357-a896-4ea5-a27e-9e3f78ddc273": { name: "Listing Appointment", weight: 90, tpl: "listing-appt" },
  "5efd15c2-1706-47a9-b54f-38d892c16a0d": { name: "Listing Appointment", weight: 90, tpl: "listing-appt" },
  // Active on MLS (weight 85)
  "fe06cdce-3e95-46b8-b6da-ffd3a2aefd4f": { name: "Active on MLS", weight: 85, tpl: "active-mls" },
  "e9b58fd0-c45e-434f-9187-5185d6917d5d": { name: "Active on MLS", weight: 85, tpl: "active-mls" },
  "ff211c0b-6411-4ab1-920e-24ba90b73ff3": { name: "Active on MLS", weight: 85, tpl: "active-mls" },
  "d5cd9e42-89d9-41a0-9c07-07cd9f09ddec": { name: "Active on MLS", weight: 85, tpl: "active-mls" },
  "a9bf1c1c-f3d8-4261-886e-5ae5c834e23c": { name: "Active on MLS", weight: 85, tpl: "active-mls" },
  "3a6fd7ab-6c68-46dc-aafb-da85f6ad7fc1": { name: "Active on MLS", weight: 85, tpl: "active-mls" },
  "84c2c826-c511-4310-8cdc-a29289ff4ded": { name: "Active on MLS", weight: 85, tpl: "active-mls" },
  "0ce6c640-273b-4280-aae2-6b05646c19c9": { name: "Active on MLS", weight: 85, tpl: "active-mls" },
  "1cdb69f3-ae0c-4713-bfdd-6b5597a2bccd": { name: "Active on MLS", weight: 85, tpl: "active-mls" },
  // Under Contract (weight 80)
  "07664a06-250a-4537-b78f-f2c1cf223e9c": { name: "Under Contract", weight: 80, tpl: "under-contract" },
  "699d23f1-7dbd-4883-9729-7c4fcd7bf031": { name: "Under Contract", weight: 80, tpl: "under-contract" },
  "1a3f9ed7-a994-45ca-8b30-f0078b077524": { name: "Under Contract", weight: 80, tpl: "under-contract" },
  // Proposal Sent (weight 70)
  "5a748335-83bf-48d2-ba71-3f58da9a6195": { name: "Proposal Sent", weight: 70, tpl: "proposal-sent" },
  "aaeabdde-da4a-4ca4-9550-dc82dc908a61": { name: "Proposal Sent", weight: 70, tpl: "proposal-sent" },
  // Listed / Just Listed (weight 60)
  "4f729263-6b45-4be9-858e-e3ed27bb5b6f": { name: "Just Listed", weight: 60, tpl: "listed" },
  "30f43f7c-45f0-4e53-ad40-57af3bfc4469": { name: "Just Listed", weight: 60, tpl: "listed" },
  "7fe6576a-d288-420f-8ff2-8ef10863361b": { name: "Just Listed", weight: 60, tpl: "listed" },
  // Past client (weight 50)
  "ed2e2abb-6270-44b4-a76a-58a63495b4f9": { name: "Past Client", weight: 50, tpl: "past-client" },
  "19ccbc9c-c323-4e7b-a124-b950a3b2a28c": { name: "Past Client", weight: 50, tpl: "past-client" },
};

// Send time slot pools (minutes from midnight, America/Denver local)
const SLOT_POOLS: Record<string, number[]> = {
  "pre-listing":    [9*60+30, 9*60+45, 10*60, 10*60+15, 10*60+30, 10*60+45, 11*60, 11*60+15, 11*60+30, 11*60+45],
  "listing-appt":   [9*60+30, 9*60+45, 10*60, 10*60+15, 10*60+30, 10*60+45, 11*60, 11*60+15, 11*60+30, 11*60+45],
  "proposal-sent":  [10*60+30, 10*60+45, 11*60, 11*60+15, 11*60+30],
  "under-contract": [11*60, 11*60+15, 11*60+30, 11*60+45],
  "active-mls":     [11*60+30, 15*60, 15*60+15, 15*60+30, 15*60+45],
  "listed":         [11*60+30, 15*60, 15*60+15, 15*60+30],
  "past-client":    [16*60, 16*60+15, 16*60+30, 16*60+45, 17*60, 17*60+15],
};
const FALLBACK_SLOTS = [15*60+30, 15*60+45, 16*60, 16*60+15, 16*60+30, 16*60+45, 17*60, 17*60+15, 17*60+30];
const LUNCH_START = 12 * 60;
const LUNCH_END   = 13 * 60;
const MIN_SLOT    = 9  * 60;
const MAX_SLOT    = 17 * 60 + 30;

function assignSendTimes(items: Array<{ tpl: string; suggestedSendTime?: string }>) {
  const used = new Set<number>();
  for (const item of items) {
    const pool = [...(SLOT_POOLS[item.tpl] ?? []), ...FALLBACK_SLOTS];
    let assigned: number | undefined;
    for (const slot of pool) {
      if (slot >= MIN_SLOT && slot <= MAX_SLOT &&
          !(slot >= LUNCH_START && slot < LUNCH_END) &&
          !used.has(slot)) {
        assigned = slot;
        used.add(slot);
        break;
      }
    }
    if (assigned === undefined) {
      for (let t = MIN_SLOT; t <= MAX_SLOT; t += 5) {
        if (!(t >= LUNCH_START && t < LUNCH_END) && !used.has(t)) {
          assigned = t;
          used.add(t);
          break;
        }
      }
    }
    if (assigned !== undefined) {
      const h = Math.floor(assigned / 60);
      const m = assigned % 60;
      item.suggestedSendTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }
}

const HOT_TAGS = ["hot 0-30", "past client", "hot", "seller hot"];

interface GHLContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tags: string[];
}

interface GHLOpportunity {
  id: string;
  name: string;
  pipelineStageId: string;
  contactId: string;
  updatedAt: string;
  contact: GHLContact;
}

export interface VideoTextRecommendation {
  contactId: string;
  opportunityId: string;
  name: string;
  firstName: string;
  phone: string | null;
  email: string | null;
  stage: string;
  tags: string[];
  lastActivity: string;
  suggestedPrompt: string;
  suggestedSendTime: string;
}

function buildPrompt(tpl: string, firstName: string, address: string, stage: string, tags: string[]): string {
  const isHot = tags.some((t) => HOT_TAGS.includes(t.toLowerCase()));
  if (isHot && tpl !== "past-client") {
    return `${firstName}, thought of you — the St. George market moved this week. Quick update + a question for you.`;
  }
  switch (tpl) {
    case "pre-listing":
    case "listing-appt":
      return `Quick video for ${firstName} — excited about getting ${address} ready for market. Confirming next steps and want to share what's different about how we market listings.`;
    case "proposal-sent":
      return `Hi ${firstName}, wanted to follow up on the proposal — quick question about timing. When works to chat this week?`;
    case "under-contract":
      return `${firstName}, congrats again — quick update on where we are in the transaction and what to expect next.`;
    case "active-mls":
    case "listed":
      return `Quick thank-you video for ${firstName} — the listing at ${address} is live. Sharing the first showing feedback with you.`;
    case "past-client":
      return `${firstName}, thought of you — the St. George market moved this week. Quick update + a question for you.`;
    default:
      return `${firstName}, quick check-in — how's everything going with the ${stage} process?`;
  }
}

function recencyScore(updatedAt: string): number {
  const daysAgo = (Date.now() - new Date(updatedAt).getTime()) / 86_400_000;
  if (daysAgo < 1)  return 30;
  if (daysAgo < 3)  return 20;
  if (daysAgo < 7)  return 15;
  if (daysAgo < 14) return 10;
  if (daysAgo < 30) return 5;
  return 0;
}

function tagScore(tags: string[]): number {
  return tags.map((t) => t.toLowerCase()).some((t) => HOT_TAGS.includes(t)) ? 20 : 0;
}

export async function GET(req: NextRequest) {
  // Optional bearer auth — if THRIVES_ALERTS_TOKEN is set, enforce it
  const requiredToken = process.env.THRIVES_ALERTS_TOKEN;
  if (requiredToken) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${requiredToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const token      = process.env.GHL_PIT_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) {
    return NextResponse.json(
      { error: "GHL_PIT_TOKEN and GHL_LOCATION_ID env vars are required" },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(
      `${GHL_API_BASE}/opportunities/search?location_id=${locationId}&limit=100&status=open`,
      {
        headers: { Authorization: `Bearer ${token}`, Version: GHL_API_VERSION },
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) {
      return NextResponse.json({ error: `GHL API error ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const opportunities: GHLOpportunity[] = data.opportunities ?? [];

    const withTpl: Array<VideoTextRecommendation & { tpl: string }> = [];
    const scored: Array<{ rec: VideoTextRecommendation & { tpl: string }; score: number }> = [];

    for (const opp of opportunities) {
      const stageInfo = STAGE_MAP[opp.pipelineStageId];
      if (!stageInfo) continue;

      const contact = opp.contact ?? {};
      const tags: string[] = contact.tags ?? [];
      const score = stageInfo.weight + recencyScore(opp.updatedAt) + tagScore(tags);

      const fullName  = contact.name ?? "Friend";
      const firstName = fullName.split(" ")[0];
      const address   = opp.name.replace(/\s*[-–—]\s*(St\.?\s*George|Washington County|Utah|UT).*/i, "").trim() || opp.name;

      const rec = {
        contactId:        contact.id,
        opportunityId:    opp.id,
        name:             fullName,
        firstName,
        phone:            contact.phone ?? null,
        email:            contact.email ?? null,
        stage:            stageInfo.name,
        tags,
        lastActivity:     opp.updatedAt,
        suggestedPrompt:  buildPrompt(stageInfo.tpl, firstName, address, stageInfo.name, tags),
        suggestedSendTime: "",
        tpl:              stageInfo.tpl,
      };
      scored.push({ rec, score });
    }

    scored.sort((a, b) => b.score - a.score);

    const seen = new Set<string>();
    const top10: Array<VideoTextRecommendation & { tpl: string }> = [];
    for (const { rec } of scored) {
      if (!seen.has(rec.contactId)) {
        seen.add(rec.contactId);
        top10.push(rec);
      }
      if (top10.length >= 10) break;
    }

    // Assign staggered send times (mutates in place)
    assignSendTimes(top10);

    // Strip internal tpl field before returning
    const recommendations: VideoTextRecommendation[] = top10.map(({ tpl: _tpl, ...rest }) => rest);

    return NextResponse.json({ recommendations, total: scored.length });
  } catch (err) {
    console.error("video-text-recommendations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
