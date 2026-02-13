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

// Create OpenAI client only if key exists
const openai =
  process.env.OPENAI_API_KEY &&
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

export async function generateAIData(
  url: string,
  title: string
): Promise<AIResult> {
  // ✅ Use real AI if API key exists
  if (openai) {
    try {
      return await generateWithOpenAI(url, title);
    } catch (error) {
      console.error('OpenAI failed, falling back to mock AI:', error);
    }
  }

  // ✅ Fallback to mock AI (always works)
  return generateWithMockAI(url, title);
}

/* ------------------------------------------------------------------ */
/* ------------------------ OPENAI IMPLEMENTATION -------------------- */
/* ------------------------------------------------------------------ */

async function generateWithOpenAI(
  url: string,
  title: string
): Promise<AIResult> {
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

  const response = await openai!.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;

  if (!content) {
    throw new Error('Empty OpenAI response');
  }

  const parsed = JSON.parse(content);

  return {
    summary: String(parsed.summary || ''),
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
  };
}

/* ------------------------------------------------------------------ */
/* -------------------------- MOCK IMPLEMENTATION -------------------- */
/* ------------------------------------------------------------------ */

async function generateWithMockAI(
  url: string,
  title: string
): Promise<AIResult> {
  // Simulate AI delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    summary: generateSummaryFromTitle(title),
    tags: generateTagsFromUrl(url, title),
  };
}

function generateTagsFromUrl(url: string, title: string): string[] {
  const tags: string[] = [];
  const text = (url + ' ' + title).toLowerCase();

  // Technology
  if (/github|code|programming|dev/.test(text)) tags.push('development');
  if (/react|vue|angular|next/.test(text)) tags.push('frontend');
  if (/node|python|java|go/.test(text)) tags.push('backend');
  if (/ai|ml|machine learning|neural/.test(text)) tags.push('ai');
  if (/design|figma|ux|ui/.test(text)) tags.push('design');

  // Content type
  if (/article|blog|post/.test(text)) tags.push('article');
  if (/video|youtube|watch/.test(text)) tags.push('video');
  if (/doc|documentation|guide/.test(text)) tags.push('documentation');
  if (/tutorial|learn|course/.test(text)) tags.push('tutorial');

  // Domain
  if (url.includes('youtube.com')) tags.push('youtube');
  if (url.includes('github.com')) tags.push('github');
  if (url.includes('stackoverflow.com')) tags.push('stackoverflow');
  if (url.includes('medium.com')) tags.push('medium');
  if (url.includes('dev.to')) tags.push('devto');

  if (tags.length === 0) tags.push('general');

  return [...new Set(tags)].slice(0, 5);
}

function generateSummaryFromTitle(title: string): string {
  return `This bookmark is a useful reference about "${title}".`;
}
