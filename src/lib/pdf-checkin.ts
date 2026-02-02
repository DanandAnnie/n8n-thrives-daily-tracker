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

const QUESTIONS = [
  { key: "thankful", label: "Thankfulness Practice", group: "thrives" },
  { key: "happy", label: "Happy & Helpful Actions", group: "thrives" },
  { key: "resourceful", label: "Resourceful & Resilient Mindset", group: "thrives" },
  { key: "affirmation", label: "I Am Affirmation & Inhale Practice", group: "thrives" },
  { key: "visualize", label: "Visualization Practice", group: "thrives" },
  { key: "exercise", label: "Expect, Excite, & Exercise", group: "thrives" },
  { key: "switch", label: "Stop, Snatch, Switch Practice", group: "thrives" },
  { key: "dailySheet", label: "Daily Sheet Completion", group: "practice" },
  { key: "videoTexts", label: "Sending 10 Video Texts", group: "practice" },
  { key: "skinInGame", label: "Attending Skin of the Game", group: "practice" },
  { key: "mindMovie", label: "Mind Movie Map Practice", group: "practice" },
  { key: "successSprint", label: "Success Sprint Completion", group: "practice" },
  { key: "eveningRituals", label: "Evening Rituals", group: "practice" },
  { key: "timeBlocking", label: "Time Blocking", group: "practice" },
];

function drawRatingScale(doc: jsPDF, x: number, y: number, rating: number, w: number) {
  const boxSize = 5;
  const gap = (w - boxSize * 10) / 9;
  for (let i = 1; i <= 10; i++) {
    const bx = x + (i - 1) * (boxSize + gap);
    if (i === rating) {
      doc.setFillColor(34, 197, 94);
      doc.rect(bx, y, boxSize, boxSize, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setDrawColor(180);
      doc.rect(bx, y, boxSize, boxSize);
      doc.setTextColor(100);
    }
    doc.setFontSize(7);
    doc.text(String(i), bx + 1.5, y + 3.8);
  }
  doc.setTextColor(30, 30, 30);
}

export function generateCheckInPDF(data?: any): jsPDF {
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
  doc.text(" Check-In", (w / 2) + 28, y);
  y += 8;

  // Period
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Period:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data?.period || "_______________", margin + 16, y);
  y += 5;

  // Date
  doc.setFont("helvetica", "bold");
  doc.text("Date:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data?.date || "_______________", margin + 16, y);
  y += 8;

  // Score summary
  if (data?.ratings) {
    const values = Object.values(data.ratings).filter((v): v is number => typeof v === "number" && v > 0);
    const score = values.length > 0 ? Math.round((values.reduce((a: number, b: number) => a + b, 0) / (values.length * 10)) * 100) : 0;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const scoreColor = score >= 85 ? [34, 197, 94] : score >= 60 ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`Overall Score: ${score}%`, w - margin - 45, y - 6);
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("Target: 85%", w - margin - 45, y - 2);
    doc.setTextColor(30, 30, 30);
  }

  // Rating questions
  doc.setFontSize(10);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(59, 130, 246);
  doc.text("THRIVES Ratings (1-10)", margin, y);
  doc.setTextColor(30, 30, 30);
  y += 5;

  const ratingWidth = w - margin * 2 - 80;
  QUESTIONS.forEach((q, idx) => {
    if (idx === 7) {
      y += 4;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bolditalic");
      doc.setTextColor(59, 130, 246);
      doc.text("Practice Ratings (1-10)", margin, y);
      doc.setTextColor(30, 30, 30);
      y += 5;
    }

    const thriveMatch = idx < 7 ? THRIVES[idx] : null;
    if (thriveMatch) {
      doc.setTextColor(thriveMatch.color[0], thriveMatch.color[1], thriveMatch.color[2]);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(thriveMatch.letter, margin, y);
      doc.setTextColor(30, 30, 30);
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(q.label, margin + (thriveMatch ? 7 : 0), y);

    const rating = data?.ratings?.[q.key] || 0;
    drawRatingScale(doc, margin + 80, y - 3.5, rating, ratingWidth);
    y += 7;
  });

  y += 5;

  // Reflection questions
  const reflections = [
    { key: "doingWell", label: "What am I doing well?" },
    { key: "doMore", label: "What can I continue doing more of?" },
    { key: "weakAreas", label: "What areas am I weak in?" },
    { key: "improve", label: "What can I do to improve?" },
    { key: "resources", label: "What resources do I need?" },
  ];

  doc.setFontSize(10);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(59, 130, 246);
  doc.text("Reflections", margin, y);
  doc.setTextColor(30, 30, 30);
  y += 5;

  reflections.forEach((r) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(r.label, margin, y);
    y += 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const val = data?.reflections?.[r.key] || "";
    const lines = doc.splitTextToSize(val, w - margin * 2);
    doc.text(lines.length ? lines : [""], margin, y);
    doc.setDrawColor(200);
    doc.line(margin, y + 1, w - margin, y + 1);
    y += Math.max(lines.length * 3.5, 8);
  });

  return doc;
}
