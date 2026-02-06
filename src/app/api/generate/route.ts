import { NextRequest, NextResponse } from "next/server";

interface GenerateRequest {
  type: "questions" | "focus" | "idea";
  focusQuote?: string;
  wordOfQuarter?: string;
}

// Empowering question templates
const QUESTION_TEMPLATES = [
  "How can I use {word} to create more value today?",
  "What would make today absolutely amazing?",
  "How can I be {word} in my interactions today?",
  "What's the most important thing I can accomplish today?",
  "How can I serve others while pursuing my goals?",
  "What fear can I face today to grow stronger?",
  "How can I make progress toward my biggest dream today?",
  "What can I do today that my future self will thank me for?",
  "How can I bring more energy and enthusiasm to everything I do?",
  "What limiting belief can I challenge today?",
  "How can I create massive momentum toward my goals?",
  "What would I do if I knew I couldn't fail?",
  "How can I add more value than anyone expects?",
  "What can I learn today that will transform my life?",
  "How can I make someone else's day better?",
];

const FOCUS_QUOTES = [
  "The only way to do great work is to love what you do.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Your network is your net worth.",
  "Be the energy you want to attract.",
  "Progress, not perfection.",
  "What you focus on expands.",
  "Leaders are readers.",
  "Act as if it were impossible to fail.",
  "The harder you work, the luckier you get.",
  "Your habits determine your future.",
  "Dream big, start small, act now.",
  "Discipline equals freedom.",
  "Energy flows where attention goes.",
  "You don't attract what you want, you attract what you are.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
];

const MILLION_DOLLAR_IDEAS = [
  "AI-powered personal finance coach that analyzes spending habits and creates custom savings plans",
  "Subscription box for small business owners with curated tools, books, and resources each month",
  "A platform connecting local real estate investors with homeowners facing foreclosure for win-win deals",
  "Mobile app that gamifies daily habits and accountability with a community leaderboard",
  "Virtual staging service using AI for real estate listings at 1/10th the cost",
  "On-demand video messaging platform for personalized client follow-ups at scale",
  "Neighborhood micro-investing app where locals fund and profit from community businesses",
  "AI assistant that generates personalized morning routines based on your goals and calendar",
  "Digital course platform for teaching THRIVES-style personal development systems",
  "Automated lead nurturing system that sends personalized video texts based on CRM data",
  "Community-based co-working app that matches entrepreneurs by complementary skills",
  "White-label accountability tracker app for coaches and mentors to give their teams",
  "AI-powered property analysis tool that predicts neighborhood growth and ROI",
  "Peer-to-peer mentorship marketplace connecting experienced entrepreneurs with beginners",
  "Smart calendar app that auto-schedules time blocks based on your priorities and energy levels",
];

function generateQuestions(wordOfQuarter?: string, focusQuote?: string): string {
  const questions: string[] = [];

  // Add word-based questions if word of quarter is provided
  if (wordOfQuarter && wordOfQuarter.trim()) {
    const word = wordOfQuarter.trim();
    questions.push(`How can I embody "${word}" in everything I do today?`);
    questions.push(`What opportunities will present themselves for me to practice "${word}"?`);
  }

  // Add quote-based question if quote is provided
  if (focusQuote && focusQuote.trim()) {
    const quote = focusQuote.trim();
    questions.push(`How can I live out "${quote}" today?`);
  }

  // Add general empowering questions
  const shuffled = QUESTION_TEMPLATES.sort(() => 0.5 - Math.random());
  const selectedTemplates = shuffled.slice(0, 5 - questions.length);

  for (const template of selectedTemplates) {
    let question = template;
    if (wordOfQuarter && question.includes("{word}")) {
      question = question.replace("{word}", wordOfQuarter.toLowerCase());
    } else if (question.includes("{word}")) {
      question = question.replace("{word}", "excellent");
    }
    questions.push(question);
  }

  return questions.slice(0, 5).map((q, i) => `${i + 1}. ${q}`).join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { type, focusQuote, wordOfQuarter } = body;

    if (type === "questions") {
      // Check if OpenAI API key is available for more sophisticated generation
      const openaiKey = process.env.OPENAI_API_KEY;

      if (openaiKey) {
        try {
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openaiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: "You are a personal development coach. Generate 5 empowering questions to help someone start their day with focus and intention. Format as numbered list.",
                },
                {
                  role: "user",
                  content: `Generate 5 empowering questions for today. ${
                    wordOfQuarter ? `My word of the quarter is "${wordOfQuarter}".` : ""
                  } ${
                    focusQuote ? `Today's focus/quote is: "${focusQuote}".` : ""
                  } Make the questions specific, actionable, and inspiring.`,
                },
              ],
              max_tokens: 500,
              temperature: 0.8,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const questions = data.choices[0]?.message?.content || "";
            return NextResponse.json({ questions });
          }
        } catch (err) {
          console.error("OpenAI API error:", err);
          // Fall through to template-based generation
        }
      }

      // Use template-based generation as fallback
      const questions = generateQuestions(wordOfQuarter, focusQuote);
      return NextResponse.json({ questions });
    }

    if (type === "focus") {
      const shuffled = FOCUS_QUOTES.sort(() => 0.5 - Math.random());
      return NextResponse.json({ focus: shuffled[0] });
    }

    if (type === "idea") {
      const shuffled = MILLION_DOLLAR_IDEAS.sort(() => 0.5 - Math.random());
      return NextResponse.json({ idea: shuffled[0] });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
