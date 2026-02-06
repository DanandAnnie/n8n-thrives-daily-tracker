"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateDailySheetPDF } from "@/lib/pdf-daily-sheet";
import { generateCheckInPDF } from "@/lib/pdf-checkin";

interface CheckInEntry {
  date: string;
  period: string;
  score: number;
  ratings?: Record<string, number>;
  reflections?: Record<string, string>;
  [key: string]: any;
}

interface DailyEntry {
  date: string;
  focusQuote: string;
  habitsCompleted: number;
  habitsTotal: number;
  [key: string]: any;
}

interface LocalSheet {
  id: string;
  date: string;
  savedAt: string;
  data: any;
}

export default function History() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkIns, setCheckIns] = useState<CheckInEntry[]>([]);
  const [dailySheets, setDailySheets] = useState<DailyEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      // Load from localStorage first (always available)
      const localSheets: DailyEntry[] = [];
      try {
        const stored = localStorage.getItem("thrives-daily-sheets");
        if (stored) {
          const sheets: LocalSheet[] = JSON.parse(stored);
          sheets.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
          for (const sheet of sheets) {
            const habits = sheet.data.dailyHabits || {};
            const completed = [habits.skinOfTheGame, habits.mindMovieMap, habits.videoTexts].filter(Boolean).length;
            localSheets.push({
              ...sheet.data,
              date: sheet.date,
              focusQuote: sheet.data.focusQuote || "",
              habitsCompleted: completed,
              habitsTotal: 3,
            });
          }
        }
      } catch (e) {
        console.error("Failed to load localStorage:", e);
      }

      // Also try n8n for check-in scores
      let remoteCheckIns: CheckInEntry[] = [];
      try {
        const response = await fetch("/api/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get-history" }),
        });
        if (response.ok) {
          const data = await response.json();
          remoteCheckIns = data.checkIns || [];
        }
      } catch (e) {
        console.error("Failed to load from n8n:", e);
      }

      setCheckIns(remoteCheckIns);
      setDailySheets(localSheets);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {!loaded && loading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Loading history...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md">{error}</div>
      )}

      {loaded && (
        <>
          {/* Check-In Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Check-In Scores</CardTitle>
              <CardDescription>Your weekly/monthly self-assessment scores (goal: 85%)</CardDescription>
            </CardHeader>
            <CardContent>
              {checkIns.length === 0 ? (
                <p className="text-muted-foreground text-sm">No check-ins recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {checkIns.map((entry, i) => {
                    const color =
                      entry.score >= 85
                        ? "bg-green-100 text-green-800 border-green-300"
                        : entry.score >= 70
                        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                        : "bg-red-100 text-red-800 border-red-300";
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3 rounded-md border ${color}`}
                      >
                        <div>
                          <span className="font-medium">{entry.period}</span>
                          <span className="text-sm ml-2 opacity-75">{entry.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold">{entry.score}%</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 px-2"
                            onClick={() => {
                              const doc = generateCheckInPDF(entry);
                              doc.save(`THRIVES-CheckIn-${entry.date}.pdf`);
                            }}
                          >
                            PDF
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Daily Sheets */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Daily Sheets</CardTitle>
              <CardDescription>Your recent daily tracking entries</CardDescription>
            </CardHeader>
            <CardContent>
              {dailySheets.length === 0 ? (
                <p className="text-muted-foreground text-sm">No daily sheets recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {dailySheets.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-md border bg-muted/50"
                    >
                      <div>
                        <span className="font-medium">{entry.date}</span>
                        {entry.focusQuote && (
                          <span className="text-sm ml-2 text-muted-foreground italic">
                            &quot;{entry.focusQuote}&quot;
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {entry.habitsCompleted}/{entry.habitsTotal} habits
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 px-2"
                          onClick={() => {
                            const doc = generateDailySheetPDF(entry);
                            doc.save(`THRIVES-Daily-Sheet-${entry.date}.pdf`);
                          }}
                        >
                          PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Button variant="outline" onClick={fetchHistory} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
