"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

const RATING_QUESTIONS = [
  { key: "thankful", label: "T - Thankful: I practiced gratitude daily", color: "text-green-500" },
  { key: "happyHelpful", label: "H - Happy & Helpful: I chose happiness and helped others", color: "text-orange-500" },
  { key: "resourceful", label: "R - Resourceful & Resilient: I found solutions and bounced back", color: "text-red-500" },
  { key: "affirmation", label: "I - I Am Affirmation & Inhale: I spoke my affirmations and breathed intentionally", color: "text-yellow-500" },
  { key: "visualize", label: "V - Visualize: I visualized my goals and success", color: "text-teal-500" },
  { key: "exercise", label: "E - Expect, Excite, & Exercise: I expected the best, got excited, and moved my body", color: "text-pink-500" },
  { key: "stopSnatch", label: "S - Stop, Snatch, Switch: I caught negative thoughts and replaced them", color: "text-purple-500" },
  { key: "dailySheet", label: "I filled out my Daily Sheet every day", color: "text-foreground" },
  { key: "videoTexts", label: "I sent 10 Video Text Messages every day", color: "text-foreground" },
  { key: "skinGame", label: "I attended Skin in the Game", color: "text-foreground" },
  { key: "mindMovie", label: "I did my Mind Movie Map", color: "text-foreground" },
  { key: "successSprint", label: "I completed my Success Sprints", color: "text-foreground" },
  { key: "eveningRituals", label: "I completed my Evening Rituals", color: "text-foreground" },
  { key: "timeBlocking", label: "I time-blocked and followed my schedule", color: "text-foreground" },
];

export default function CheckIn() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [period, setPeriod] = useState("week-1");
  const [ratings, setRatings] = useState<Record<string, string>>(
    Object.fromEntries(RATING_QUESTIONS.map((q) => [q.key, "5"]))
  );
  const [reflections, setReflections] = useState({
    doingWell: "",
    continueDoing: "",
    weakAreas: "",
    improve: "",
    resources: "",
  });

  const score = useMemo(() => {
    const values = Object.values(ratings).map(Number);
    const total = values.reduce((a, b) => a + b, 0);
    const max = values.length * 10;
    return Math.round((total / max) * 100);
  }, [ratings]);

  const scoreColor = score >= 85 ? "text-green-600" : score >= 70 ? "text-yellow-600" : "text-red-600";
  const progressColor = score >= 85 ? "bg-green-500" : score >= 70 ? "bg-yellow-500" : "bg-red-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-checkin",
          data: { period, ratings, reflections, score },
        }),
      });
      if (!response.ok) throw new Error("Failed to save check-in");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <div className={`text-6xl font-extrabold ${scoreColor}`}>{score}%</div>
          <h3 className="text-xl font-bold">Check-In Saved!</h3>
          <p className="text-muted-foreground">
            {score >= 85
              ? "You're hitting your target - keep it up!"
              : "Keep pushing toward your 85% goal!"}
          </p>
          <Button onClick={() => setSubmitted(false)}>Do Another Check-In</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Score Display */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-extrabold ${scoreColor}`}>{score}%</div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Your Score</span>
                <span className="text-muted-foreground">Target: 85%</span>
              </div>
              <div className="relative">
                <Progress value={score} className="h-4" />
                {/* 85% target marker */}
                <div
                  className="absolute top-0 h-4 w-0.5 bg-foreground"
                  style={{ left: "85%" }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <Label>Check-In Period</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week-1">Week 1</SelectItem>
              <SelectItem value="week-2">Week 2</SelectItem>
              <SelectItem value="week-3">Week 3</SelectItem>
              <SelectItem value="week-4">Week 4</SelectItem>
              <SelectItem value="monthly">Monthly Review</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Rating Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Yourself (1-10)</CardTitle>
          <CardDescription>
            How often did you fulfill these tasks? What you track grows!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RATING_QUESTIONS.map((q) => (
              <div key={q.key} className="space-y-1">
                <Label className={`text-sm ${q.color}`}>{q.label}</Label>
                <Select
                  value={ratings[q.key]}
                  onValueChange={(v) => setRatings((prev) => ({ ...prev, [q.key]: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reflection Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Reflection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "doingWell", label: "What am I doing well?" },
            { key: "continueDoing", label: "What can I continue to do more of?" },
            { key: "weakAreas", label: "What are the areas I am weak in?" },
            { key: "improve", label: "What can I do to improve?" },
            { key: "resources", label: "What resources may I need?" },
          ].map((q) => (
            <div key={q.key} className="space-y-1">
              <Label>{q.label}</Label>
              <Textarea
                value={(reflections as any)[q.key]}
                onChange={(e) =>
                  setReflections((prev) => ({ ...prev, [q.key]: e.target.value }))
                }
                placeholder="Your thoughts..."
                rows={2}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md">{error}</div>
      )}

      <Button type="submit" className="w-full" disabled={loading} size="lg">
        {loading ? "Saving..." : "Submit Check-In"}
      </Button>
    </form>
  );
}
