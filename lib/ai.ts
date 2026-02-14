/**
 * AI Auto-tagging and Summary Generation
 */

import OpenAI from 'openai';

export interface AIResult {
  summary: string;
  tags: string[];
}

// ✅ Initialize properly
const openai =
  process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    : null;

export async function generateAIData(
  url: string,
  title: string
): Promise<AIResult> {
  // Use real AI if the client exists
  if (openai) {
    try {
      return await generateWithOpenAI(url, title);
    } catch (error) {
      console.error('OpenAI failed, falling back to mock AI:', error);
    }
  }

  // Fallback to mock AI (always works)
  return generateWithMockAI(url, title);
}

/* ------------------------------------------------------------------ */
/* ------------------------ OPENAI IMPLEMENTATION -------------------- */
/* ------------------------------------------------------------------ */

async function generateWithOpenAI(
  url: string,
  title: string
): Promise<AIResult> {
  if (!openai) {
    throw new Error('OpenAI client is not properly initialized');
  }

  const prompt = `
Summarize the following webpage in 2–3 short sentences.
Then generate 3–5 relevant tags.

Return RAW JSON only (no markdown, no backticks):
{
  "summary": "text",
  "tags": ["tag1", "tag2"]
}

Title: ${title}
URL: ${url}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    // ✅ Next.js 15 / OpenAI best practice: Force JSON mode if supported
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;

  if (!content) {
    throw new Error('Empty OpenAI response');
  }

  try {
    // ✅ Clean potential markdown backticks just in case
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanContent);
    
    return {
      summary: String(parsed.summary || `A link to ${title}`),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : ['general'],
    };
  } catch (e) {
    console.error('AI JSON parsing failed. Content received:', content);
    throw new Error('Invalid JSON from AI');
  }
}

/* ------------------------------------------------------------------ */
/* -------------------------- MOCK IMPLEMENTATION -------------------- */
/* ------------------------------------------------------------------ */

async function generateWithMockAI(
  url: string,
  title: string
): Promise<AIResult> {
  // Simulating small delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    summary: `Informational resource regarding "${title}".`,
    tags: generateTagsFromUrl(url, title),
  };
}

function generateTagsFromUrl(url: string, title: string): string[] {
  const tags: string[] = [];
  const text = (url + ' ' + title).toLowerCase();

  if (/github|code|programming|dev/.test(text)) tags.push('development');
  if (/react|vue|angular|next/.test(text)) tags.push('frontend');
  if (/node|python|java|go/.test(text)) tags.push('backend');
  if (/ai|ml|machine learning|neural/.test(text)) tags.push('ai');
  if (/design|figma|ux|ui/.test(text)) tags.push('design');
  if (url.includes('youtube.com')) tags.push('youtube');
  if (url.includes('github.com')) tags.push('github');

  if (tags.length === 0) tags.push('general');
  return [...new Set(tags)].slice(0, 5);
}