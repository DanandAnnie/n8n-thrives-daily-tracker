import { jsPDF } from "jspdf";

const THRIVES = [
  { letter: "T", label: "Thankful", color: [34, 197, 94] },
  { letter: "H", label: "Happy & Helpful", color: [249, 115, 22] },
  { letter: "R", label: "Resourceful & Resilient", color: [239, 68, 68] },
  { letter: "I", label: "I Am Affirmation & Inhale", color: [234, 179, 8] },
  { letter: "V", label: "Visualize", color: [20, 184, 166] },
  { letter: "E", label: "Expect, Excite, & Exercise", color: [236, 72, 153] },
  { letter: "S", label: "Stop, Snatch, Switch", color: [168, 85, 247] },
];

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const TIME_SLOTS = [
  "5:00","6:00","7:00","8:00","9:00","10:00","11:00","12:00",
  "1:00","2:00","3:00","4:00","5:00 PM","6:00 PM","7:00 PM",
];

function drawCheckbox(doc: jsPDF, x: number, y: number, checked: boolean, size = 4) {
  doc.setDrawColor(150);
  doc.rect(x, y, size, size);
  if (checked) {
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.5);
    doc.line(x + 0.8, y + 2, x + 1.6, y + 3.2);
    doc.line(x + 1.6, y + 3.2, x + 3.2, y + 0.8);
    doc.setLineWidth(0.2);
  }
}

export function generateDailySheetPDF(data?: any): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const w = doc.internal.pageSize.getWidth();
  const margin = 12;
  let y = 12;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  THRIVES.forEach((t, i) => {
    doc.setTextColor(t.color[0], t.color[1], t.color[2]);
    const xOff = (w / 2) - 30 + i * 8;
    doc.text(t.letter, xOff, y);
  });
  doc.setTextColor(30, 30, 30);
  doc.text(" Daily Sheet", (w / 2) + 28, y);
  y += 8;

  // Date & Day of Week
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DATE:", margin, y);
  doc.setFont("helvetica", "normal");
  const dateVal = data?.date || "_______________";
  doc.text(dateVal, margin + 16, y);

  // Day circles
  let dayX = margin + 60;
  DAYS.forEach((d, i) => {
    const isActive = data && data.dayOfWeek === i;
    if (isActive) {
      doc.setFillColor(30, 30, 30);
      doc.circle(dayX + 2, y - 1.5, 3, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setDrawColor(150);
      doc.circle(dayX + 2, y - 1.5, 3);
      doc.setTextColor(100);
    }
    doc.setFontSize(7);
    doc.text(d, dayX + 0.8, y - 0.5);
    doc.setTextColor(30, 30, 30);
    dayX += 9;
  });
  y += 6;

  // Word of QTR/YR & Focus
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Word of the QTR/YR:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data?.wordOfQuarter || "", margin + 40, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Focus / Quote of the Day:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data?.focusQuote || "", margin + 45, y);
  y += 8;

  // THRIVES section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  THRIVES.forEach((t) => {
    doc.setTextColor(t.color[0], t.color[1], t.color[2]);
    doc.setFontSize(14);
    doc.text(t.letter, margin, y);
    doc.setTextColor(100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text(t.label, margin + 8, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    const val = data?.thrives?.[t.letter] || "";
    doc.text(val, margin + 55, y);
    doc.setDrawColor(t.color[0], t.color[1], t.color[2]);
    doc.line(margin + 8, y + 1, w - margin, y + 1);
    y += 7;
  });
  y += 3;

  // Success Sprint & Daily Habits side by side
  const midX = w / 2;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(30, 30, 30);
  doc.text("Success Sprint", margin, y);
  let spX = margin + 32;
  for (let i = 0; i < 5; i++) {
    drawCheckbox(doc, spX, y - 3, data?.successSprint?.[i] || false);
    spX += 6;
  }
  doc.setFontSize(7);
  doc.text("Bonus:", spX + 1, y);
  spX += 12;
  for (let i = 0; i < 2; i++) {
    drawCheckbox(doc, spX, y - 3, data?.successSprintBonus?.[i] || false);
    spX += 6;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bolditalic");
  doc.text("Daily Habits", midX + 10, y);
  y += 6;

  // Daily habits checkboxes
  const habits = [
    { key: "skinOfTheGame", label: "Attend Skin of the Game" },
    { key: "mindMovieMap", label: "Mind Movie Map" },
    { key: "videoTexts", label: "Send 10 Video Texts" },
  ];
  habits.forEach((h) => {
    drawCheckbox(doc, midX + 10, y - 3, data?.dailyHabits?.[h.key] || false);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(h.label, midX + 16, y);
    y += 5;
  });
  y += 3;

  // Empowering Questions
  doc.setFontSize(10);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(59, 130, 246);
  doc.text("Empowering Questions", margin, y);
  doc.setTextColor(30, 30, 30);
  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const eqLines = doc.splitTextToSize(data?.empoweringQuestions || "", w - margin * 2);
  doc.text(eqLines.length ? eqLines : [""], margin, y);
  y += Math.max(eqLines.length * 3.5, 10);

  // Million Dollar Idea
  doc.setFontSize(10);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(59, 130, 246);
  doc.text("Million Dollar Idea", margin, y);
  doc.setTextColor(30, 30, 30);
  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const mdiLines = doc.splitTextToSize(data?.millionDollarIdea || "", w - margin * 2);
  doc.text(mdiLines.length ? mdiLines : [""], margin, y);
  y += Math.max(mdiLines.length * 3.5, 10);

  // Gratitude and Wins
  doc.setFontSize(10);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(59, 130, 246);
  doc.text("Gratitude and Wins", margin, y);
  doc.setTextColor(30, 30, 30);
  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const gwLines = doc.splitTextToSize(data?.gratitudeWins || "", w - margin * 2);
  doc.text(gwLines.length ? gwLines : [""], margin, y);
  y += Math.max(gwLines.length * 3.5, 10);

  // PAGE 2 - Hit List, Time Blocks, Journal, Evening Rituals
  doc.addPage();
  y = 12;

  // Hit List
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Hit List and Time Blocks", margin, y);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100);
  doc.text("(Hard Stuff First)", margin + 48, y);
  doc.setTextColor(30, 30, 30);
  y += 5;

  for (let i = 0; i < 4; i++) {
    drawCheckbox(doc, margin, y - 3, data?.hitListChecks?.[i] || false);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(data?.hitList?.[i] || "", margin + 7, y);
    doc.setDrawColor(200);
    doc.line(margin + 7, y + 1, midX - 5, y + 1);
    y += 6;
  }
  y += 2;

  // Time Blocks
  TIME_SLOTS.forEach((time) => {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(time, margin, y);
    doc.setTextColor(30, 30, 30);
    doc.text(data?.timeBlocks?.[time] || "", margin + 16, y);
    doc.setDrawColor(220);
    doc.line(margin + 16, y + 1, midX - 5, y + 1);
    y += 5;
  });

  // Journal / Notes (right column on page 2)
  let ry = 12;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Journal / Notes", midX + 5, ry);
  ry += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const journalLines = doc.splitTextToSize(data?.journalNotes || "", midX - margin - 5);
  doc.text(journalLines.length ? journalLines : [""], midX + 5, ry);
  ry += Math.max(journalLines.length * 3.5, 40);

  // Tomorrow's Success Predictions
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(59, 130, 246);
  doc.text("Tomorrow's Success Predictions", midX + 5, ry);
  doc.setTextColor(30, 30, 30);
  ry += 5;
  for (let i = 0; i < 3; i++) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(data?.tomorrowPredictions?.[i] || "", midX + 5, ry);
    doc.setDrawColor(200);
    doc.line(midX + 5, ry + 1, w - margin, ry + 1);
    ry += 6;
  }
  ry += 5;

  // Evening Rituals
  doc.setFontSize(10);
  doc.setFont("helvetica", "bolditalic");
  doc.text("Evening Rituals", midX + 5, ry);
  ry += 5;
  const rituals = [
    { key: "calendarTomorrow", label: "Calendar Out My Day for Tomorrow" },
    { key: "mindMovieTomorrow", label: "Mind Movie Map for Tomorrow" },
  ];
  rituals.forEach((r) => {
    drawCheckbox(doc, midX + 5, ry - 3, data?.eveningRituals?.[r.key] || false);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(r.label, midX + 12, ry);
    ry += 5;
  });

  return doc;
}
