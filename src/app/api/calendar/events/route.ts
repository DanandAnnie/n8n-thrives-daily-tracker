import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const accessToken = searchParams.get("access_token");

    if (!date || !accessToken) {
      return NextResponse.json(
        { error: "Missing date or access_token" },
        { status: 400 }
      );
    }

    const timeMin = `${date}T00:00:00Z`;
    const timeMax = `${date}T23:59:59Z`;

    const url = new URL(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    );
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(
        { error: err.error?.message || "Failed to fetch calendar" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const events = (data.items || [])
      .filter((item: any) => item.start?.dateTime)
      .map((item: any) => {
        const start = new Date(item.start.dateTime);
        let hour = start.getHours();
        const isPM = hour >= 12;
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const timeKey =
          hour >= 17
            ? `${displayHour}:00 PM`
            : `${displayHour}:00`;
        return {
          time: timeKey,
          summary: item.summary || "Busy",
        };
      });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Calendar events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
