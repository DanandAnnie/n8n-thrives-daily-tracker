"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { generateDailySheetPDF } from "@/lib/pdf-daily-sheet";

const THRIVES = [
  { letter: "T", label: "Thankful", color: "text-green-500", border: "border-green-500" },
  { letter: "H", label: "Happy & Helpful", color: "text-orange-500", border: "border-orange-500" },
  { letter: "R", label: "Resourceful & Resilient", color: "text-red-500", border: "border-red-500" },
  { letter: "I", label: "I Am Affirmation & Inhale", color: "text-yellow-500", border: "border-yellow-500" },
  { letter: "V", label: "Visualize", color: "text-teal-500", border: "border-teal-500" },
  { letter: "E", label: "Expect, Excite, & Exercise", color: "text-pink-500", border: "border-pink-500" },
  { letter: "S", label: "Stop, Snatch, Switch", color: "text-purple-500", border: "border-purple-500" },
];

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const TIME_SLOTS = [
  "5:00", "6:00", "7:00", "8:00", "9:00", "10:00", "11:00", "12:00",
  "1:00", "2:00", "3:00", "4:00", "5:00 PM", "6:00 PM", "7:00 PM",
];

type TimeBlock = {
  start: string;
  end: string;
  label: string;
  category: "expireds-fsbos" | "frbo-str" | "appointments" | "follow-up";
};

function getTimeBlocksForDay(dayOfWeek: number): TimeBlock[] {
  // dayOfWeek: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  const appt: TimeBlock = { start: "2:00 PM", end: "4:00 PM", label: "Listing Appointments", category: "appointments" };
  const expireds: TimeBlock = { start: "8:00 AM", end: "10:00 AM", label: "Expireds + FSBOs", category: "expireds-fsbos" };
  const frbo: TimeBlock = { start: "8:00 AM", end: "10:00 AM", label: "FRBO / STR Investor Outreach", category: "frbo-str" };
  switch (dayOfWeek) {
    case 0: return [expireds, appt];           // Mon
    case 1: return [frbo, appt];               // Tue
    case 2: return [expireds, appt];           // Wed
    case 3: return [frbo, appt];               // Thu
    case 4: return [expireds, appt];           // Fri
    case 5: return [{ start: "9:00 AM", end: "11:00 AM", label: "Follow-up + FRBO", category: "follow-up" }]; // Sat
    default: return [];                        // Sun
  }
}

const BLOCK_STYLES: Record<TimeBlock["category"], string> = {
  "expireds-fsbos": "border-red-500 bg-red-500/10 text-red-400",
  "frbo-str":       "border-blue-500 bg-blue-500/10 text-blue-400",
  "appointments":   "border-amber-400 bg-amber-400/10 text-amber-400",
  "follow-up":      "border-green-500 bg-green-500/10 text-green-400",
};

interface SavedSheet {
  id: string;
  date: string;
  savedAt: string;
  data: typeof defaultFormData;
}

const STORAGE_KEY = "thrives-daily-sheets";

const defaultFormData = {
  date: "",
  dayOfWeek: 0,
  wordOfQuarter: "",
  focusQuote: "",
  thrives: { T: "", H: "", R: "", I: "", V: "", E: "", S: "" } as Record<string, string>,
  successSprint: [false, false, false, false, false],
  successSprintBonus: [false, false],
  thrivesChecks: [false, false],
  thrivesBonus: [false, false],
  dailyHabits: {
    skinOfTheGame: false,
    mindMovieMap: false,
    videoTexts: false,
  },
  empoweringQuestions: "",
  millionDollarIdea: "",
  gratitudeWins: "",
  hitList: ["", "", "", ""],
  hitListChecks: [false, false, false, false],
  timeBlocks: {} as Record<string, string>,
  journalNotes: "",
  tomorrowPredictions: ["", "", ""],
  eveningRituals: {
    calendarTomorrow: false,
    mindMovieTomorrow: false,
  },
};

// ---------------------------------------------------------------------------
// Video text recommendations sub-component
// ---------------------------------------------------------------------------

interface VideoRec {
  contactId: string;
  opportunityId: string;
  name: string;
  firstName: string;
  phone: string | null;
  stage: string;
  tags: string[];
  lastActivity: string;
  suggestedPrompt: string;
  suggestedSendTime: string; // "HH:MM" 24h local Mountain Time
}

// "09:30" → "9:30 AM", "15:00" → "3:00 PM"
function formatSendTime(hhmm: string): string {
  const [hh, mm] = hhmm.split(":").map(Number);
  const period = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${period}`;
}

// Maps "HH:MM" to the TIME_SLOTS key for the hour that contains it
function slotKeyForTime(hhmm: string): string {
  const hh = parseInt(hhmm.split(":")[0], 10);
  if (hh === 13) return "1:00";
  if (hh === 14) return "2:00";
  if (hh === 15) return "3:00";
  if (hh === 16) return "4:00";
  if (hh === 17) return "5:00 PM";
  if (hh === 18) return "6:00 PM";
  if (hh === 19) return "7:00 PM";
  return `${hh}:00`;
}

const STAGE_BADGE: Record<string, string> = {
  "Pre Listing":         "bg-orange-500/20 text-orange-400 border-orange-500",
  "Listing Appointment": "bg-yellow-500/20 text-yellow-400 border-yellow-500",
  "Active on MLS":       "bg-green-500/20 text-green-400 border-green-500",
  "Under Contract":      "bg-blue-500/20 text-blue-400 border-blue-500",
  "Proposal Sent":       "bg-purple-500/20 text-purple-400 border-purple-500",
  "Just Listed":         "bg-teal-500/20 text-teal-400 border-teal-500",
  "Past Client":         "bg-pink-500/20 text-pink-400 border-pink-500",
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function VideoTextRecommendations({
  onRecsLoaded,
  autoExpand,
}: {
  onRecsLoaded?: (recs: VideoRec[]) => void;
  autoExpand?: string | null;
}) {
  const [recs, setRecs] = useState<VideoRec[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const sectionRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/video-text-recommendations`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const loaded: VideoRec[] = data.recommendations ?? [];
      setRecs(loaded);
      onRecsLoaded?.(loaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [onRecsLoaded]);

  useEffect(() => { load(); }, [load]);

  // When a time-grid chip is clicked, expand that rec and scroll to it
  useEffect(() => {
    if (!autoExpand) return;
    setExpanded((p) => ({ ...p, [autoExpand]: true }));
    setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  }, [autoExpand]);

  const copyPrompt = (id: string, prompt: string) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 2000);
    });
  };

  return (
    <div ref={sectionRef} className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Suggested Video Texts
        </p>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {!loading && !error && recs.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No hot leads in active stages right now.</p>
      )}

      {recs.map((rec) => {
        const badge = STAGE_BADGE[rec.stage] ?? "bg-muted text-muted-foreground border-border";
        const isOpen = expanded[rec.opportunityId];
        return (
          <div key={rec.opportunityId} className="rounded-md border border-border bg-muted/30 text-sm">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-left"
              onClick={() => setExpanded((p) => ({ ...p, [rec.opportunityId]: !p[rec.opportunityId] }))}
            >
              <span className="flex-1 font-medium truncate">{rec.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded border ${badge} whitespace-nowrap`}>
                {rec.stage}
              </span>
              {rec.suggestedSendTime && (
                <span className="text-xs bg-primary/10 text-primary border border-primary/30 px-1.5 py-0.5 rounded whitespace-nowrap font-mono">
                  {formatSendTime(rec.suggestedSendTime)}
                </span>
              )}
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {relativeTime(rec.lastActivity)}
              </span>
              <span className="text-muted-foreground text-xs">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                {rec.phone && (
                  <p className="text-xs text-muted-foreground">{rec.phone}</p>
                )}
                {rec.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {rec.tags.map((t) => (
                      <span key={t} className="text-xs bg-muted px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-foreground bg-muted/50 rounded p-2 leading-relaxed">
                  {rec.suggestedPrompt}
                </p>
                <button
                  type="button"
                  onClick={() => copyPrompt(rec.opportunityId, rec.suggestedPrompt)}
                  className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90"
                >
                  {copied[rec.opportunityId] ? "Copied!" : "Copy prompt"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DailySheet() {
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [focusLoading, setFocusLoading] = useState(false);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarSynced, setCalendarSynced] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [calendarMessage, setCalendarMessage] = useState("");
  const [savedSheets, setSavedSheets] = useState<SavedSheet[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [videoRecs, setVideoRecs] = useState<VideoRec[]>([]);
  const [autoExpandRec, setAutoExpandRec] = useState<string | null>(null);

  const today = new Date();
  const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const localDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const [formData, setFormData] = useState({
    date: localDateStr(today),
    dayOfWeek: dayIndex,
    wordOfQuarter: "",
    focusQuote: "",
    thrives: { T: "", H: "", R: "", I: "", V: "", E: "", S: "" } as Record<string, string>,
    successSprint: [false, false, false, false, false],
    successSprintBonus: [false, false],
    thrivesChecks: [false, false],
    thrivesBonus: [false, false],
    dailyHabits: {
      skinOfTheGame: false,
      mindMovieMap: false,
      videoTexts: false,
    },
    empoweringQuestions: "",
    millionDollarIdea: "",
    gratitudeWins: "",
    hitList: ["", "", "", ""],
    hitListChecks: [false, false, false, false],
    timeBlocks: {} as Record<string, string>,
    journalNotes: "",
    tomorrowPredictions: ["", "", ""],
    eveningRituals: {
      calendarTomorrow: false,
      mindMovieTomorrow: false,
    },
  });

  const updateField = (path: string, value: any) => {
    setFormData((prev) => {
      const copy = { ...prev } as any;
      const parts = path.split(".");
      let obj = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  const generateAIQuestions = async () => {
    setAiLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "questions",
          focusQuote: formData.focusQuote,
          wordOfQuarter: formData.wordOfQuarter,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.questions) {
          updateField("empoweringQuestions", result.questions);
        }
      }
    } catch (err) {
      console.error("Failed to generate questions:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const generateFocusQuote = async () => {
    setFocusLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "focus" }),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.focus) updateField("focusQuote", result.focus);
      }
    } catch (err) {
      console.error("Failed to generate focus quote:", err);
    } finally {
      setFocusLoading(false);
    }
  };

  const generateMillionDollarIdea = async () => {
    setIdeaLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "idea" }),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.idea) updateField("millionDollarIdea", result.idea);
      }
    } catch (err) {
      console.error("Failed to generate idea:", err);
    } finally {
      setIdeaLoading(false);
    }
  };

  const generatePredictions = async () => {
    setPredictionsLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "predictions" }),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.predictions) {
          updateField("tomorrowPredictions", result.predictions);
        }
      }
    } catch (err) {
      console.error("Failed to generate predictions:", err);
    } finally {
      setPredictionsLoading(false);
    }
  };

  const loadCalendarEvents = async () => {
    if (!googleAccessToken) {
      connectGoogleCalendar();
      return;
    }
    setCalendarLoading(true);
    setCalendarMessage("");
    try {
      const response = await fetch(
        `/api/calendar/events?date=${formData.date}&access_token=${googleAccessToken}`
      );
      if (response.ok) {
        const result = await response.json();
        const newBlocks = { ...formData.timeBlocks };
        for (const event of result.events || []) {
          if (event.time && !newBlocks[event.time]) {
            newBlocks[event.time] = event.summary;
          }
        }
        updateField("timeBlocks", newBlocks);
        setCalendarMessage(`Loaded ${(result.events || []).length} events`);
      } else {
        setCalendarMessage("Failed to load events");
      }
    } catch (err) {
      console.error("Failed to load calendar events:", err);
      setCalendarMessage("Failed to load events");
    } finally {
      setCalendarLoading(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      const response = await fetch("/api/auth/google");
      const data = await response.json();

      if (data.error) {
        setCalendarMessage(data.error);
        return;
      }

      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error("Failed to start Google auth:", err);
      setCalendarMessage("Failed to connect to Google Calendar");
    }
  };

  const syncToCalendar = async () => {
    if (!googleAccessToken) {
      // Need to connect first
      connectGoogleCalendar();
      return;
    }

    setCalendarSyncing(true);
    setCalendarSynced(false);
    setCalendarMessage("");

    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: googleAccessToken,
          date: formData.date,
          timeBlocks: formData.timeBlocks,
          hitList: formData.hitList,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCalendarSynced(true);
        setCalendarMessage(result.message || "Calendar synced!");
      } else {
        setCalendarMessage(result.error || "Failed to sync calendar");
      }
    } catch (err) {
      console.error("Failed to sync calendar:", err);
      setCalendarMessage("Failed to sync calendar");
    } finally {
      setCalendarSyncing(false);
    }
  };

  // Load saved sheets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const sheets = JSON.parse(stored) as SavedSheet[];
        // Sort by savedAt descending (most recent first)
        sheets.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        setSavedSheets(sheets);
      }
    } catch (err) {
      console.error("Failed to load saved sheets:", err);
    }
  }, []);

  // Check for Google OAuth callback on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get("auth");
    const accessToken = params.get("access_token");

    if (authStatus === "success" && accessToken) {
      setGoogleAccessToken(accessToken);
      setCalendarConnected(true);
      setCalendarMessage("Google Calendar connected!");

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authStatus === "error") {
      const message = params.get("message") || "Authentication failed";
      setCalendarMessage(`Calendar auth error: ${message}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Pre-fill AI questions on initial load (only if fields are empty)
  useEffect(() => {
    if (!formData.empoweringQuestions) {
      generateAIQuestions();
    }
  }, []);

  const saveToLocalStorage = (data: typeof formData) => {
    try {
      const newSheet: SavedSheet = {
        id: `${data.date}-${Date.now()}`,
        date: data.date,
        savedAt: new Date().toISOString(),
        data: data,
      };

      // Check if we already have a sheet for this date
      const existingIndex = savedSheets.findIndex((s) => s.date === data.date);
      let updatedSheets: SavedSheet[];

      if (existingIndex >= 0) {
        // Update existing sheet
        updatedSheets = [...savedSheets];
        updatedSheets[existingIndex] = newSheet;
      } else {
        // Add new sheet
        updatedSheets = [newSheet, ...savedSheets];
      }

      // Keep only the last 30 sheets
      updatedSheets = updatedSheets.slice(0, 30);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSheets));
      setSavedSheets(updatedSheets);
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
    }
  };

  const loadSavedSheet = (sheet: SavedSheet) => {
    setFormData(sheet.data);
    setShowHistory(false);
  };

  const deleteSavedSheet = (sheetId: string) => {
    const updatedSheets = savedSheets.filter((s) => s.id !== sheetId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSheets));
    setSavedSheets(updatedSheets);
  };

  const clearForm = () => {
    const now = new Date();
    const di = now.getDay() === 0 ? 6 : now.getDay() - 1;
    setFormData({
      ...defaultFormData,
      date: localDateStr(now),
      dayOfWeek: di,
    });
    setSaveMessage("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaveMessage("");
    try {
      saveToLocalStorage(formData);

      try {
        await fetch("/api/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save-daily", data: formData }),
        });
      } catch {
        // Ignore n8n errors
      }

      setSaveMessage("Daily Sheet Saved!");
      setTimeout(() => setSaveMessage(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saveMessage && (
        <div className="p-3 bg-green-500/20 text-green-400 rounded-md text-center text-sm font-medium">
          {saveMessage}
        </div>
      )}

      {/* Date & Day of Week */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => {
                  const val = e.target.value;
                  updateField("date", val);
                  if (val) {
                    const d = new Date(val + "T12:00:00");
                    updateField("dayOfWeek", d.getDay() === 0 ? 6 : d.getDay() - 1);
                  }
                }}
              />
            </div>
            <div className="flex gap-1">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => updateField("dayOfWeek", i)}
                  className={`w-8 h-8 rounded text-xs font-bold border ${
                    formData.dayOfWeek === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Word of Quarter & Focus */}
      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Word of the QTR/YR</Label>
            <Input
              value={formData.wordOfQuarter}
              onChange={(e) => updateField("wordOfQuarter", e.target.value)}
              placeholder="Your word..."
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Focus / Quote of the Day</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generateFocusQuote}
                disabled={focusLoading}
                className="text-xs h-6 px-2"
              >
                {focusLoading ? "..." : "Suggest"}
              </Button>
            </div>
            <Input
              value={formData.focusQuote}
              onChange={(e) => updateField("focusQuote", e.target.value)}
              placeholder="Today's focus..."
            />
          </div>
        </CardContent>
      </Card>

      {/* THRIVES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {"THRIVES".split("").map((l, i) => (
              <span key={i} className={THRIVES[i].color + " font-extrabold text-2xl"}>
                {l}
              </span>
            ))}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {THRIVES.map((item) => (
            <div key={item.letter} className="flex items-center gap-3">
              <span className={`${item.color} font-extrabold text-2xl w-8 text-center`}>
                {item.letter}
              </span>
              <div className="flex-1">
                <Input
                  value={formData.thrives[item.letter]}
                  onChange={(e) => updateField(`thrives.${item.letter}`, e.target.value)}
                  placeholder={item.label}
                  className={`border-b-2 ${item.border}`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Manifesting Visualization Audio */}
      <Card>
        <CardContent className="pt-6">
          <Label className="text-base font-bold italic text-primary">Manifesting Visualization</Label>
          <audio controls className="w-full mt-2" preload="metadata">
            <source src="/manifesting-visualization.mp3" type="audio/mpeg" />
          </audio>
        </CardContent>
      </Card>

      {/* Success Sprint & Daily Habits */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-base font-bold italic">Success Sprint</Label>
              <div className="flex gap-2 items-center">
                {formData.successSprint.map((checked, i) => (
                  <Checkbox
                    key={i}
                    checked={checked}
                    onCheckedChange={(v) => {
                      const arr = [...formData.successSprint];
                      arr[i] = v as boolean;
                      updateField("successSprint", arr);
                    }}
                    className="h-6 w-6 border-yellow-400 data-[state=checked]:bg-yellow-400"
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-2">Bonus:</span>
                {formData.successSprintBonus.map((checked, i) => (
                  <Checkbox
                    key={i}
                    checked={checked}
                    onCheckedChange={(v) => {
                      const arr = [...formData.successSprintBonus];
                      arr[i] = v as boolean;
                      updateField("successSprintBonus", arr);
                    }}
                    className="h-6 w-6 border-gray-400 data-[state=checked]:bg-gray-400"
                  />
                ))}
              </div>

              <Label className="text-base font-bold">THRIVES</Label>
              <div className="flex gap-2 items-center">
                {formData.thrivesChecks.map((checked, i) => (
                  <Checkbox
                    key={i}
                    checked={checked}
                    onCheckedChange={(v) => {
                      const arr = [...formData.thrivesChecks];
                      arr[i] = v as boolean;
                      updateField("thrivesChecks", arr);
                    }}
                    className="h-6 w-6 border-yellow-400 data-[state=checked]:bg-yellow-400"
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-2">Bonus:</span>
                {formData.thrivesBonus.map((checked, i) => (
                  <Checkbox
                    key={i}
                    checked={checked}
                    onCheckedChange={(v) => {
                      const arr = [...formData.thrivesBonus];
                      arr[i] = v as boolean;
                      updateField("thrivesBonus", arr);
                    }}
                    className="h-6 w-6 border-gray-400 data-[state=checked]:bg-gray-400"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-bold italic">Daily Habits</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.dailyHabits.skinOfTheGame}
                    onCheckedChange={(v) =>
                      updateField("dailyHabits.skinOfTheGame", v as boolean)
                    }
                    className="h-5 w-5"
                  />
                  <Label className="font-normal">
                    <a
                      href="https://zoom.us/j/96062300372#success"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-400 hover:text-blue-300"
                    >
                      Attend Skin of the Game
                    </a>
                    <span className="text-xs text-muted-foreground ml-2">8:00 AM</span>
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.dailyHabits.mindMovieMap}
                    onCheckedChange={(v) =>
                      updateField("dailyHabits.mindMovieMap", v as boolean)
                    }
                    className="h-5 w-5"
                  />
                  <Label className="font-normal">
                    <a
                      href="/simps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-purple-400 hover:text-purple-300"
                    >
                      Mind Movie Map
                    </a>
                    <span className="text-xs text-muted-foreground ml-2">SIMPS Goals</span>
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.dailyHabits.videoTexts}
                    onCheckedChange={(v) =>
                      updateField("dailyHabits.videoTexts", v as boolean)
                    }
                    className="h-5 w-5"
                  />
                  <Label className="font-normal">Send 10 Video Texts</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Video text recommendations */}
          <VideoTextRecommendations
            onRecsLoaded={setVideoRecs}
            autoExpand={autoExpandRec}
          />
        </CardContent>
      </Card>

      {/* Empowering Questions, Million Dollar Idea, Gratitude */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold italic text-primary">Empowering Questions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateAIQuestions}
                disabled={aiLoading}
                className="text-xs"
              >
                {aiLoading ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
            <Textarea
              value={formData.empoweringQuestions}
              onChange={(e) => updateField("empoweringQuestions", e.target.value)}
              placeholder="What empowering questions are you asking yourself today?"
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold italic text-primary">Million Dollar Idea</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateMillionDollarIdea}
                disabled={ideaLoading}
                className="text-xs"
              >
                {ideaLoading ? "Generating..." : "Trending Ideas"}
              </Button>
            </div>
            <Textarea
              value={formData.millionDollarIdea}
              onChange={(e) => updateField("millionDollarIdea", e.target.value)}
              placeholder="What's your million dollar idea today?"
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-base font-bold italic text-primary">Gratitude and Wins</Label>
            <Textarea
              value={formData.gratitudeWins}
              onChange={(e) => updateField("gratitudeWins", e.target.value)}
              placeholder="What are you grateful for? What wins did you have?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hit List & Time Blocks */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-base font-bold">Hit List and Time Blocks</Label>
              <p className="text-xs text-muted-foreground">(Hard Stuff First)</p>
              {formData.hitList.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.hitListChecks[i]}
                    onCheckedChange={(v) => {
                      const arr = [...formData.hitListChecks];
                      arr[i] = v as boolean;
                      updateField("hitListChecks", arr);
                    }}
                    className="h-5 w-5 border-yellow-400 data-[state=checked]:bg-yellow-400"
                  />
                  <Input
                    value={item}
                    onChange={(e) => {
                      const arr = [...formData.hitList];
                      arr[i] = e.target.value;
                      updateField("hitList", arr);
                    }}
                    placeholder={`Priority ${i + 1}`}
                  />
                </div>
              ))}

              {/* Prospecting schedule for the selected day */}
              <div className="space-y-1 mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prospecting Schedule</p>
                {getTimeBlocksForDay(formData.dayOfWeek).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No prospecting blocks scheduled — rest day.</p>
                ) : (
                  getTimeBlocksForDay(formData.dayOfWeek).map((block, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded border-l-4 text-sm ${BLOCK_STYLES[block.category]}`}>
                      <span className="font-medium whitespace-nowrap">{block.start} – {block.end}</span>
                      <span className="text-xs opacity-80">—</span>
                      <span>{block.label}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 mt-4">
                {(() => {
                  // Build slot → recs map for chip rendering
                  const recsBySlot: Record<string, VideoRec[]> = {};
                  for (const rec of videoRecs) {
                    if (!rec.suggestedSendTime) continue;
                    const key = slotKeyForTime(rec.suggestedSendTime);
                    (recsBySlot[key] ??= []).push(rec);
                  }
                  return TIME_SLOTS.map((time) => (
                    <div key={time} className="flex items-center gap-2">
                      <span className="text-sm w-16 text-muted-foreground shrink-0">{time}</span>
                      <Input
                        value={formData.timeBlocks[time] || ""}
                        onChange={(e) =>
                          updateField("timeBlocks", {
                            ...formData.timeBlocks,
                            [time]: e.target.value,
                          })
                        }
                        placeholder=""
                        className="h-8 text-sm"
                      />
                      {(recsBySlot[time] ?? []).map((rec) => {
                        const badge = STAGE_BADGE[rec.stage] ?? "bg-muted text-muted-foreground border-border";
                        return (
                          <button
                            key={rec.opportunityId}
                            type="button"
                            title={`${rec.name} — ${rec.stage}\n${rec.suggestedPrompt}`}
                            onClick={() => setAutoExpandRec(rec.opportunityId)}
                            className={`shrink-0 text-xs px-1.5 py-0.5 rounded border ${badge} whitespace-nowrap`}
                          >
                            {rec.firstName} {formatSendTime(rec.suggestedSendTime)}
                          </button>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadCalendarEvents}
                    disabled={calendarLoading}
                    className="flex-1"
                  >
                    {calendarLoading ? "Loading..." : "Load from Calendar"}
                  </Button>
                  <Button
                    type="button"
                    variant={calendarConnected ? "default" : "outline"}
                    size="sm"
                    onClick={syncToCalendar}
                    disabled={calendarSyncing}
                    className="flex-1"
                  >
                    {calendarSyncing
                      ? "Syncing..."
                      : calendarSynced
                      ? "Synced!"
                      : calendarConnected
                      ? "Sync to Calendar"
                      : "Connect Calendar"}
                  </Button>
                </div>
                {calendarMessage && (
                  <p className={`text-xs text-center ${calendarSynced ? "text-green-600" : "text-muted-foreground"}`}>
                    {calendarMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-base font-bold">Journal / Notes</Label>
                <Textarea
                  value={formData.journalNotes}
                  onChange={(e) => updateField("journalNotes", e.target.value)}
                  placeholder="Your thoughts..."
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold text-primary">Tomorrow&apos;s Success Predictions</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generatePredictions}
                    disabled={predictionsLoading}
                    className="text-xs h-6 px-2"
                  >
                    {predictionsLoading ? "..." : "Suggest"}
                  </Button>
                </div>
                {formData.tomorrowPredictions.map((pred, i) => (
                  <Input
                    key={i}
                    value={pred}
                    onChange={(e) => {
                      const arr = [...formData.tomorrowPredictions];
                      arr[i] = e.target.value;
                      updateField("tomorrowPredictions", arr);
                    }}
                    placeholder={`Prediction ${i + 1}`}
                  />
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-base font-bold italic">Evening Rituals</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.eveningRituals.calendarTomorrow}
                    onCheckedChange={(v) =>
                      updateField("eveningRituals.calendarTomorrow", v as boolean)
                    }
                    className="h-5 w-5"
                  />
                  <Label className="font-normal">Calendar Out My Day for Tomorrow</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.eveningRituals.mindMovieTomorrow}
                    onCheckedChange={(v) =>
                      updateField("eveningRituals.mindMovieTomorrow", v as boolean)
                    }
                    className="h-5 w-5"
                  />
                  <Label className="font-normal">
                    <a
                      href="/simps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-purple-400 hover:text-purple-300"
                    >
                      Mind Movie Map for Tomorrow
                    </a>
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Daily Sheets */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Saved Sheets</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? "Hide" : `Show (${savedSheets.length})`}
            </Button>
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent className="pt-0">
            {savedSheets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No saved sheets yet. Your saved sheets will appear here.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedSheets.map((sheet) => (
                  <div
                    key={sheet.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {new Date(sheet.date + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saved {new Date(sheet.savedAt).toLocaleString()}
                      </p>
                      {sheet.data.focusQuote && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          Focus: {sheet.data.focusQuote}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => loadSavedSheet(sheet)}
                      >
                        Load
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteSavedSheet(sheet.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md">{error}</div>
      )}

      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={loading} size="lg">
          {loading ? "Saving..." : "Save Daily Sheet"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={clearForm}
        >
          Clear Form
        </Button>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => {
            const doc = generateDailySheetPDF();
            doc.save("THRIVES-Daily-Sheet-Blank.pdf");
          }}
        >
          Download Blank Template
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => {
            const doc = generateDailySheetPDF(formData);
            doc.save(`THRIVES-Daily-Sheet-${formData.date}.pdf`);
          }}
        >
          Download Filled PDF
        </Button>
      </div>
    </form>
  );
}
