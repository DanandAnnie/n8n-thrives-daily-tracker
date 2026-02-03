import { NextRequest, NextResponse } from "next/server";

interface GenerateRequest {
  type: "questions";
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

const QUOTE_BASED_QUESTIONS = [
  "How does '{quote}' apply to my situation today?",
  "What action can I take right now to embody '{quote}'?",
  "How can I share the wisdom of '{quote}' with others?",
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

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
