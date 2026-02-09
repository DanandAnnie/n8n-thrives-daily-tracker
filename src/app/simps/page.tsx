"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const LIFE_AREAS = [
  { key: "health", label: "Health", emoji: "💪", color: "text-green-400 border-green-400" },
  { key: "finances", label: "Finances", emoji: "💰", color: "text-yellow-400 border-yellow-400" },
  { key: "relationships", label: "Relationships", emoji: "❤️", color: "text-red-400 border-red-400" },
  { key: "community", label: "Community", emoji: "🤝", color: "text-blue-400 border-blue-400" },
  { key: "spirituality", label: "Spirituality", emoji: "🙏", color: "text-purple-400 border-purple-400" },
  { key: "business", label: "Business", emoji: "🚀", color: "text-orange-400 border-orange-400" },
  { key: "fun", label: "Fun", emoji: "🎉", color: "text-pink-400 border-pink-400" },
];

const STORAGE_KEY = "thrives-simps-goals";

interface GoalArea {
  vision: string;
  imageUrl: string;
}

type GoalsData = Record<string, GoalArea>;

export default function SIMPSGoals() {
  const [goals, setGoals] = useState<GoalsData>(() => {
    const defaults: GoalsData = {};
    for (const area of LIFE_AREAS) {
      defaults[area.key] = { vision: "", imageUrl: "" };
    }
    return defaults;
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setGoals(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load SIMPS goals:", e);
    }
  }, []);

  const updateGoal = (key: string, field: "vision" | "imageUrl", value: string) => {
    setGoals((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-purple-400">SIMPS</span>{" "}
            <span className="text-foreground">Goals</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
            Your one-page visual blueprint of the life you&apos;re building across every key area:
            health, finances, relationships, community, spirituality, business, fun.
            Think of it like a treasure map for your Limitless Abundance.
          </p>
          <p className="text-xs text-muted-foreground mt-2 max-w-2xl mx-auto italic">
            This isn&apos;t a to-do list. It&apos;s end-state images that light that fire in your belly.
            Your reticular activating system locks onto these daily, spotting opportunities you might miss otherwise.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {saved && (
          <div className="p-3 bg-green-500/20 text-green-400 rounded-md text-center text-sm font-medium">
            Goals saved!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LIFE_AREAS.map((area) => (
            <Card key={area.key} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg flex items-center gap-2 ${area.color.split(" ")[0]}`}>
                  <span className="text-2xl">{area.emoji}</span>
                  {area.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {goals[area.key]?.imageUrl && (
                  <img
                    src={goals[area.key].imageUrl}
                    alt={`${area.label} vision`}
                    className="w-full h-32 object-cover rounded-md"
                  />
                )}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Vision Image URL</Label>
                  <Input
                    value={goals[area.key]?.imageUrl || ""}
                    onChange={(e) => updateGoal(area.key, "imageUrl", e.target.value)}
                    placeholder="Paste an image URL..."
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">End-State Vision</Label>
                  <Textarea
                    value={goals[area.key]?.vision || ""}
                    onChange={(e) => updateGoal(area.key, "vision", e.target.value)}
                    placeholder={`Describe your ideal ${area.label.toLowerCase()}...`}
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={handleSave} className="w-full" size="lg">
          Save Goals
        </Button>

        <div className="text-center">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground underline">
            Back to THRIVES Tracker
          </a>
        </div>
      </div>
    </main>
  );
}
