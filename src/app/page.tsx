"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailySheet from "@/components/daily-sheet";
import CheckIn from "@/components/check-in";
import History from "@/components/history";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            {"THRIVES".split("").map((letter, i) => {
              const colors = [
                "text-green-500",
                "text-orange-500",
                "text-red-500",
                "text-yellow-500",
                "text-teal-500",
                "text-pink-500",
                "text-purple-500",
              ];
              return (
                <span key={i} className={colors[i]}>
                  {letter}
                </span>
              );
            })}
            <span className="text-foreground ml-2">Tracker</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your core practices. What you track grows!
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily Sheet</TabsTrigger>
            <TabsTrigger value="checkin">Check-In</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <DailySheet />
          </TabsContent>

          <TabsContent value="checkin">
            <CheckIn />
          </TabsContent>

          <TabsContent value="history">
            <History />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
