"use client";

import { useState, useEffect } from "react";
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

export default function DailySheet() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarSynced, setCalendarSynced] = useState(false);

  const today = new Date();
  const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  const [formData, setFormData] = useState({
    date: today.toISOString().split("T")[0],
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
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-questions",
          data: {
            focusQuote: formData.focusQuote,
            wordOfQuarter: formData.wordOfQuarter,
          },
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

  const syncToCalendar = async () => {
    setCalendarSyncing(true);
    setCalendarSynced(false);
    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync-calendar",
          data: {
            date: formData.date,
            timeBlocks: formData.timeBlocks,
            hitList: formData.hitList,
          },
        }),
      });
      if (response.ok) {
        setCalendarSynced(true);
      }
    } catch (err) {
      console.error("Failed to sync calendar:", err);
    } finally {
      setCalendarSyncing(false);
    }
  };

  // Pre-fill AI questions on initial load
  useEffect(() => {
    generateAIQuestions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-daily", data: formData }),
      });
      if (!response.ok) throw new Error("Failed to save daily sheet");
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
          <div className="text-4xl">&#10003;</div>
          <h3 className="text-xl font-bold text-green-600">Daily Sheet Saved!</h3>
          <p className="text-muted-foreground">Your THRIVES daily sheet has been recorded.</p>
          <Button onClick={() => setSubmitted(false)}>Fill Out Another</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={(e) => updateField("date", e.target.value)}
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
            <Label>Focus / Quote of the Day</Label>
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
                {[
                  { key: "skinOfTheGame", label: "Attend Skin of the Game" },
                  { key: "mindMovieMap", label: "Mind Movie Map" },
                  { key: "videoTexts", label: "Send 10 Video Texts" },
                ].map((habit) => (
                  <div key={habit.key} className="flex items-center gap-2">
                    <Checkbox
                      checked={(formData.dailyHabits as any)[habit.key]}
                      onCheckedChange={(v) =>
                        updateField(`dailyHabits.${habit.key}`, v as boolean)
                      }
                      className="h-5 w-5"
                    />
                    <Label className="font-normal">{habit.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
            <Label className="text-base font-bold italic text-primary">Million Dollar Idea</Label>
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

              <div className="space-y-2 mt-4">
                {TIME_SLOTS.map((time) => (
                  <div key={time} className="flex items-center gap-2">
                    <span className="text-sm w-16 text-muted-foreground">{time}</span>
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
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={syncToCalendar}
                disabled={calendarSyncing}
                className="w-full mt-4"
              >
                {calendarSyncing
                  ? "Syncing..."
                  : calendarSynced
                  ? "Synced to Google Calendar"
                  : "Sync to Google Calendar"}
              </Button>
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
                <Label className="text-base font-bold text-primary">Tomorrow&apos;s Success Predictions</Label>
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
                {[
                  { key: "calendarTomorrow", label: "Calendar Out My Day for Tomorrow" },
                  { key: "mindMovieTomorrow", label: "Mind Movie Map for Tomorrow" },
                ].map((ritual) => (
                  <div key={ritual.key} className="flex items-center gap-2">
                    <Checkbox
                      checked={(formData.eveningRituals as any)[ritual.key]}
                      onCheckedChange={(v) =>
                        updateField(`eveningRituals.${ritual.key}`, v as boolean)
                      }
                      className="h-5 w-5"
                    />
                    <Label className="font-normal">{ritual.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md">{error}</div>
      )}

      <Button type="submit" className="w-full" disabled={loading} size="lg">
        {loading ? "Saving..." : "Save Daily Sheet"}
      </Button>

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
