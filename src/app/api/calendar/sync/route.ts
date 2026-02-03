import { NextRequest, NextResponse } from "next/server";

interface TimeBlock {
  time: string;
  task: string;
}

interface CalendarSyncRequest {
  accessToken: string;
  date: string;
  timeBlocks: Record<string, string>;
  hitList: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CalendarSyncRequest = await request.json();
    const { accessToken, date, timeBlocks, hitList } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated with Google Calendar" },
        { status: 401 }
      );
    }

    const createdEvents: string[] = [];
    const errors: string[] = [];

    // Convert time blocks to calendar events
    const timeBlockEntries = Object.entries(timeBlocks).filter(([_, task]) => task.trim());

    for (const [time, task] of timeBlockEntries) {
      try {
        // Parse time and create event
        const isPM = time.includes("PM");
        const timeMatch = time.match(/(\d+):(\d+)/);
        if (!timeMatch) continue;

        let hour = parseInt(timeMatch[1]);
        const minute = parseInt(timeMatch[2]) || 0;

        // Convert to 24-hour format
        if (isPM && hour !== 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        // For times 1-4 without PM marker, assume PM (afternoon)
        if (!isPM && hour >= 1 && hour <= 4) hour += 12;

        const startTime = new Date(`${date}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

        const event = {
          summary: task,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };

        const response = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
          }
        );

        if (response.ok) {
          createdEvents.push(task);
        } else {
          const errorData = await response.json();
          errors.push(`Failed to create "${task}": ${errorData.error?.message || "Unknown error"}`);
        }
      } catch (err) {
        errors.push(`Error creating "${task}": ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    // Also create events for hit list items
    for (const item of hitList) {
      if (!item.trim()) continue;

      try {
        // Create all-day task or morning reminder
        const event = {
          summary: `📋 ${item}`,
          description: "From THRIVES Daily Hit List",
          start: {
            date: date,
          },
          end: {
            date: date,
          },
        };

        const response = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
          }
        );

        if (response.ok) {
          createdEvents.push(`Hit List: ${item}`);
        }
      } catch (err) {
        // Silently ignore hit list errors
      }
    }

    return NextResponse.json({
      success: true,
      createdEvents,
      errors: errors.length > 0 ? errors : undefined,
      message: `Created ${createdEvents.length} calendar events`,
    });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync with Google Calendar" },
      { status: 500 }
    );
  }
}
