// ============================================================
// CampusPulse — Chatbot (Gemini-powered)
//
// Lightweight "Ask CampusPulse" floating widget.
// Uses the SAME Gemini API with a different system prompt.
// Reads live data from Supabase to give contextual answers.
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Incident, ChatMessage } from '../types/incident';

// ---------- Initialize ----------

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

// ---------- System Prompt ----------

function buildChatbotPrompt(incidents: Incident[]): string {
  // Aggregate current campus stats
  const openCount = incidents.filter((i) => i.status === 'Open').length;
  const inProgressCount = incidents.filter((i) => i.status === 'In Progress').length;
  const fixedCount = incidents.filter((i) => i.status === 'Fixed').length;
  const highPriority = incidents.filter(
    (i) => (i.severity === 'High' || i.severity === 'Critical') && i.status !== 'Fixed'
  ).length;

  // Get recent open incidents (top 5)
  const recentOpen = incidents
    .filter((i) => i.status !== 'Fixed')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentOpenText = recentOpen
    .map((i) => `- ${i.title} (${i.severity}) at ${i.location} — Status: ${i.status}`)
    .join('\n');

  // Get location summary
  const locationCounts = new Map<string, number>();
  for (const inc of incidents.filter((i) => i.status !== 'Fixed')) {
    locationCounts.set(inc.location, (locationCounts.get(inc.location) || 0) + 1);
  }
  const locationSummary = Array.from(locationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([loc, count]) => `- ${loc}: ${count} active issues`)
    .join('\n');

  return `You are CampusPulse Assistant, a helpful and friendly campus operations chatbot for Wales University.

CURRENT CAMPUS STATUS:
- Open issues: ${openCount}
- In Progress: ${inProgressCount}
- Fixed: ${fixedCount}
- High/Critical priority: ${highPriority}

RECENT ACTIVE ISSUES:
${recentOpenText || '- No active issues'}

LOCATION SUMMARY:
${locationSummary || '- All clear'}

YOUR CAPABILITIES:
1. Answer questions about current campus issues and their status
2. Help students understand how to report problems
3. Provide updates on campus-wide issues
4. Explain how CampusPulse works

RULES:
- Be concise and friendly. Keep responses under 3 sentences unless more detail is needed.
- Use the campus data above to give accurate, up-to-date answers.
- If asked about a specific issue you don't have data for, say so honestly.
- If asked about something outside campus operations, politely redirect.
- Never make up issue statuses or data.
- When listing issues, use bullet points.
- Suggest reporting if the student describes a problem that isn't tracked yet.`;
}

// ---------- Chat Function ----------

/**
 * Send a message to the chatbot and get a response.
 *
 * @param userMessage - The student's message
 * @param chatHistory - Previous messages for context
 * @param currentIncidents - Live incident data for contextual answers
 */
export async function sendChatMessage(
  userMessage: string,
  chatHistory: ChatMessage[],
  currentIncidents: Incident[],
): Promise<string> {
  if (!genAI || !apiKey) {
    return getCannedResponse(userMessage);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build conversation history for context
    const historyText = chatHistory
      .slice(-6) // Keep last 6 messages for context (3 exchanges)
      .map((msg) => `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `${buildChatbotPrompt(currentIncidents)}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ''}
Student: ${userMessage}

Respond as the CampusPulse Assistant:`;

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Chat request timed out')), 10000)
      ),
    ]);

    return result.response.text().trim();
  } catch (error) {
    console.error('[Chatbot] Error:', error);
    return getCannedResponse(userMessage);
  }
}

// ---------- Canned Responses (Fallback) ----------

function getCannedResponse(message: string): string {
  const lower = message.toLowerCase();

  if (/how.*report|submit|file/.test(lower)) {
    return 'To report an issue, tap the "Report an Issue" button on the home screen. Add a photo, describe the problem, and select the location. Our AI will handle the rest! 🚀';
  }

  if (/status|update|progress/.test(lower)) {
    return 'You can check the status of your reports on the home screen under "My Reports." Issues move through three stages: Open → In Progress → Fixed.';
  }

  if (/block b|plumbing|water|leak/.test(lower)) {
    return 'Block B has been experiencing recurring plumbing issues. Our maintenance team is actively working on them. If you notice a new issue, please report it so we can track and prioritize it.';
  }

  if (/wifi|internet|network/.test(lower)) {
    return 'For WiFi issues, please report the specific location and floor. Our IT Support team typically responds within 4 hours for high-priority connectivity problems.';
  }

  if (/hello|hi|hey/.test(lower)) {
    return 'Hello! 👋 I\'m the CampusPulse Assistant. I can help you check campus issues, report problems, or get status updates. What would you like to know?';
  }

  return 'I can help you with campus issue tracking! Try asking about current issues, how to report a problem, or the status of a specific location. For new problems, use the "Report an Issue" button.';
}

// ---------- Quick Actions ----------

/**
 * Pre-built quick action responses (no AI needed).
 * These are shown as suggestion chips in the chat UI.
 */
export const QUICK_ACTIONS = [
  {
    label: '📊 Campus Status',
    message: "What's the current campus status?",
  },
  {
    label: '🔴 Critical Issues',
    message: 'Are there any critical issues right now?',
  },
  {
    label: '📝 How to Report',
    message: 'How do I report a campus issue?',
  },
] as const;
