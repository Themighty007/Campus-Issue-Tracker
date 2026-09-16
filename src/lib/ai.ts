// ============================================================
// CampusPulse — AI Analysis Engine (Gemini)
//
// This is the MOST CRITICAL backend module.
// It takes a student's text + image + location and returns
// structured JSON for incident classification.
//
// IMPORTANT: Has a full fallback classifier so the app
// NEVER dies on an API timeout or failure.
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIAnalysisResult, Category } from '../types/incident';

// ---------- Initialize Gemini ----------

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

// ---------- System Prompt ----------

const SYSTEM_PROMPT = `You are CampusPulse, a campus incident classification engine for Wales University.

You receive a student's incident report consisting of:
1. A text description of the problem
2. An optional photo of the issue
3. The location where the issue was observed

Your job is to analyze the report and return ONLY a valid JSON object with the following fields:

{
  "category": string,       // Exactly one of: "Electrical", "Plumbing", "WiFi", "Cleanliness", "Infrastructure", "Facilities", "Safety", "Other"
  "subcategory": string,    // Specific issue type, e.g., "Water Leakage", "Broken Light", "Slow Connection"
  "severity": string,       // Exactly one of: "Low", "Medium", "High", "Critical"
  "summary": string,        // One clear sentence describing the incident (max 100 chars)
  "department": string,     // The responsible maintenance team
  "suggested_sla_hours": number, // Realistic SLA: 1, 4, 8, 24, or 48
  "keywords": string[]      // 3-5 relevant keywords for duplicate detection
}

SEVERITY GUIDE:
- "Critical": Immediate safety hazard, affects many people (flooding, exposed wires, gas leak, fire hazard)
- "High": Significant disruption, needs same-day fix (major water leak, power outage, broken door lock, health hazard)
- "Medium": Inconvenience, can wait 24h (flickering light, slow WiFi, dirty washroom, minor leak)
- "Low": Minor, cosmetic issue (cracked tile, faded paint, squeaky door, minor stain)

DEPARTMENT MAPPING:
- Electrical issues → "Electrical Maintenance"
- Plumbing/water issues → "Plumbing Maintenance"
- WiFi/network issues → "IT Support"
- Cleanliness/hygiene → "Housekeeping"
- Infrastructure/structural → "Civil Maintenance"
- Safety/security hazards → "Campus Security"
- Facilities/equipment → "Facilities Management"
- Other/unclear → "Facilities Management"

RULES:
- Return ONLY valid JSON. No markdown backticks, no explanation, no extra text.
- Do not invent location information beyond what is provided.
- Do not provide medical, legal, or safety-critical advice.
- If the image is unclear, rely more on the text description.
- Keep the summary factual and concise.`;

// ---------- Valid values for validation ----------

const VALID_CATEGORIES: Category[] = [
  'Electrical', 'Plumbing', 'WiFi', 'Cleanliness',
  'Infrastructure', 'Facilities', 'Safety', 'Other',
];

const VALID_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

// ---------- Main Analysis Function ----------

/**
 * Analyze an incident report using Gemini AI.
 * Returns structured JSON classification.
 * Falls back to keyword-based classification on ANY failure.
 */
export async function analyzeIncident(
  description: string,
  imageBase64: string | null,
  imageMimeType: string | null,
  location: string,
  floor: string,
): Promise<AIAnalysisResult> {
  // If no API key or no Gemini client, go straight to fallback
  if (!genAI || !apiKey) {
    console.warn('[CampusPulse AI] No Gemini API key configured. Using fallback classifier.');
    return fallbackClassifier(description);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build the prompt parts
    const userPrompt = `INCIDENT REPORT:
Description: ${description}
Location: ${location}${floor ? `, ${floor}` : ''}

Analyze this incident and return the JSON classification.`;

    // Build content parts array
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // Add system prompt
    parts.push({ text: SYSTEM_PROMPT });

    // Add image if provided
    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      });
    }

    // Add user prompt
    parts.push({ text: userPrompt });

    // Call Gemini with a timeout
    const result = await Promise.race([
      model.generateContent(parts),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out after 15 seconds')), 15000)
      ),
    ]);

    // Extract text response
    const responseText = result.response.text().trim();

    // Parse JSON — handle possible markdown code fences
    const jsonString = responseText
      .replace(/^```json?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(jsonString);

    // Validate and sanitize the response
    return validateAIResponse(parsed, description);
  } catch (error) {
    console.error('[CampusPulse AI] Analysis failed, using fallback:', error);
    return fallbackClassifier(description);
  }
}

// ---------- Validation ----------

/**
 * Validate AI response has all required fields with valid values.
 * Fix any invalid values with sensible defaults.
 */
function validateAIResponse(parsed: Record<string, unknown>, description: string): AIAnalysisResult {
  const category = VALID_CATEGORIES.includes(parsed.category as Category)
    ? (parsed.category as Category)
    : inferCategoryFromText(description);

  const severity = VALID_SEVERITIES.includes(parsed.severity as typeof VALID_SEVERITIES[number])
    ? (parsed.severity as AIAnalysisResult['severity'])
    : 'Medium';

  const suggestedSla = typeof parsed.suggested_sla_hours === 'number'
    && [1, 4, 8, 24, 48].includes(parsed.suggested_sla_hours)
    ? parsed.suggested_sla_hours
    : getSLAFromSeverity(severity);

  const keywords = Array.isArray(parsed.keywords)
    ? (parsed.keywords as unknown[]).filter((k): k is string => typeof k === 'string').slice(0, 7)
    : extractKeywords(description);

  return {
    category,
    subcategory: typeof parsed.subcategory === 'string' ? parsed.subcategory : 'General',
    severity,
    summary: typeof parsed.summary === 'string'
      ? parsed.summary.slice(0, 150)
      : description.slice(0, 100),
    department: typeof parsed.department === 'string'
      ? parsed.department
      : getDepartmentFromCategory(category),
    suggested_sla_hours: suggestedSla,
    keywords,
  };
}

// ---------- Fallback Classifier ----------

/**
 * Keyword-based fallback classifier.
 * Used when the AI API is unavailable, times out, or returns garbage.
 * This ensures the incident is ALWAYS created.
 */
export function fallbackClassifier(description: string): AIAnalysisResult {
  const category = inferCategoryFromText(description);
  const severity = inferSeverityFromText(description);

  return {
    category,
    subcategory: 'General',
    severity,
    summary: description.slice(0, 100),
    department: getDepartmentFromCategory(category),
    suggested_sla_hours: getSLAFromSeverity(severity),
    keywords: extractKeywords(description),
  };
}

// ---------- Keyword Inference Helpers ----------

function inferCategoryFromText(text: string): Category {
  const lower = text.toLowerCase();

  if (/water|leak|tap|pipe|drain|plumb|flush|seep|flood/.test(lower)) return 'Plumbing';
  if (/light|power|electric|wire|switch|fan|outlet|volt|fuse|spark/.test(lower)) return 'Electrical';
  if (/wifi|wi-fi|internet|network|connect|signal|router|bandwidth/.test(lower)) return 'WiFi';
  if (/clean|dirty|wash|garbage|trash|smell|stain|hygien|sweep|mop/.test(lower)) return 'Cleanliness';
  if (/chair|desk|door|window|wall|roof|crack|tile|paint|stair/.test(lower)) return 'Infrastructure';
  if (/fire|hazard|danger|unsafe|exposed|slip|accident|emergency/.test(lower)) return 'Safety';
  if (/gym|equipment|machine|locker|room|facility/.test(lower)) return 'Facilities';

  return 'Other';
}

function inferSeverityFromText(text: string): AIAnalysisResult['severity'] {
  const lower = text.toLowerCase();

  // Critical indicators
  if (/flood|fire|exposed wire|gas leak|emergency|danger|collapse|electr/.test(lower)) {
    return 'Critical';
  }

  // High indicators
  if (/leak|outage|broken|overflow|hazard|slip|unsafe|major|urgent|serious/.test(lower)) {
    return 'High';
  }

  // Low indicators
  if (/minor|small|cosmetic|paint|squeak|stain|faded|scratch/.test(lower)) {
    return 'Low';
  }

  return 'Medium';
}

function getDepartmentFromCategory(category: Category): string {
  const map: Record<Category, string> = {
    Electrical: 'Electrical Maintenance',
    Plumbing: 'Plumbing Maintenance',
    WiFi: 'IT Support',
    Cleanliness: 'Housekeeping',
    Infrastructure: 'Civil Maintenance',
    Safety: 'Campus Security',
    Facilities: 'Facilities Management',
    Other: 'Facilities Management',
  };
  return map[category];
}

function getSLAFromSeverity(severity: AIAnalysisResult['severity']): number {
  switch (severity) {
    case 'Critical': return 1;
    case 'High': return 4;
    case 'Medium': return 24;
    case 'Low': return 48;
  }
}

function extractKeywords(text: string): string[] {
  // Remove common stop words and extract meaningful keywords
  const stopWords = new Set([
    'the', 'is', 'at', 'in', 'on', 'a', 'an', 'and', 'or', 'but', 'to',
    'of', 'for', 'it', 'not', 'has', 'have', 'had', 'are', 'was', 'were',
    'been', 'be', 'being', 'this', 'that', 'with', 'from', 'very', 'there',
    'can', 'cannot', 'could', 'would', 'should', 'will', 'just', 'also',
    'i', 'my', 'me', 'we', 'our', 'they', 'them', 'their', 'its',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 5);
}

// ---------- Image Utilities ----------

/**
 * Convert a File object to base64 string for Gemini API.
 * Returns { base64, mimeType } or null if conversion fails.
 */
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result format: "data:image/jpeg;base64,/9j/4AAQ..."
      const base64 = result.split(',')[1];
      if (base64) {
        resolve({ base64, mimeType: file.type || 'image/jpeg' });
      } else {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
