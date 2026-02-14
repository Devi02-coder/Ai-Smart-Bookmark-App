/**
 * AI Auto-tagging and Summary Generation
 *
 * - Uses OpenAI if OPENAI_API_KEY is available
 * - Falls back to mock AI if not
 * - Always returns SAFE data (string + string[])
 */

import OpenAI from 'openai';

export interface AIResult {
  summary: string;
  tags: string[];
}

// ✅ Initialize as OpenAI instance or null (cleaner than empty string)
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
  // ✅ FIX: Type Guard. This tells TS that 'openai' is definitely the OpenAI object below this line.
  if (!openai || typeof openai === 'string') {
    throw new Error('OpenAI client is not properly initialized');
  }

  const prompt = `
Summarize the following webpage in 2–3 short sentences.
Then generate 3–5 relevant tags.

Return JSON only:
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
  });

  const content = response.choices[0].message.content;

  if (!content) {
    throw new Error('Empty OpenAI response');
  }

  try {
    const parsed = JSON.parse(content);
    return {
      summary: String(parsed.summary || ''),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    };
  } catch (e) {
    console.error('AI JSON parsing failed:', e);
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
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    summary: `This bookmark is a useful reference about "${title}".`,
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