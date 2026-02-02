"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface CheckInEntry {
  date: string;
  period: string;
  score: number;
}

interface DailyEntry {
  date: string;
  focusQuote: string;
  habitsCompleted: number;
  habitsTotal: number;
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
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-history" }),
      });
      if (!response.ok) throw new Error("Failed to load history");
      const data = await response.json();
      setCheckIns(data.checkIns || []);
      setDailySheets(data.dailySheets || []);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!loaded && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Load your history from Google Sheets to see past entries and scores.
            </p>
            <Button onClick={fetchHistory} disabled={loading}>
              {loading ? "Loading..." : "Load History"}
            </Button>
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
                        <span className="text-xl font-bold">{entry.score}%</span>
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
                      <span className="text-sm">
                        {entry.habitsCompleted}/{entry.habitsTotal} habits
                      </span>
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
