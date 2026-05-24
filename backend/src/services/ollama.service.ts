import { env } from "../config/env.js";

export type ComplaintIntelligence = {
  summary: string;
  urgency: "low" | "medium" | "high" | "critical";
  department: string;
  escalationRisk: "low" | "medium" | "high";
  sentiment: "positive" | "neutral" | "negative";
  priority: "Low" | "Medium" | "High" | "Critical";
  suggestedTags: string[];
  draftReply: string;
  confidence: number;
};

function fallbackComplaintIntelligence(input: {
  title: string;
  category: string;
  description: string;
  department: string;
}): ComplaintIntelligence {
  const text = `${input.title} ${input.category} ${input.description}`.toLowerCase();
  const critical = /(fire|flood|unsafe|collapse|attack|severe|urgent|critical|danger|injury|death|live wire|electrocution)/.test(text);
  const high = /(delay|broken|leak|noise|overflow|blocked|fault|missing|outage|repair|pothole)/.test(text);
  const negative = /(angry|frustrated|unsafe|broken|urgent|bad|terrible|unacceptable)/.test(text);

  return {
    summary: `Complaint about ${input.category.toLowerCase()} affecting ${input.department.toLowerCase()}.`,
    urgency: critical ? "critical" : high ? "high" : "medium",
    department: input.department,
    escalationRisk: critical ? "high" : high ? "medium" : "low",
    sentiment: negative ? "negative" : "neutral",
    priority: critical ? "Critical" : high ? "High" : "Medium",
    suggestedTags: [input.category.toLowerCase(), input.department.toLowerCase()],
    draftReply: "We have reviewed your complaint and assigned it to the relevant team for immediate action.",
    confidence: critical ? 0.88 : high ? 0.74 : 0.62,
  };
}

function parseInsightPayload(raw: string): ComplaintIntelligence | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ComplaintIntelligence>;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const department = typeof parsed.department === "string" ? parsed.department.trim() : "";
    const draftReply = typeof parsed.draftReply === "string" ? parsed.draftReply.trim() : "";

    if (!summary || !department || !draftReply || !parsed.urgency || !parsed.escalationRisk || !parsed.sentiment || !parsed.priority) {
      return null;
    }

    return {
      summary,
      department,
      draftReply,
      urgency: parsed.urgency,
      escalationRisk: parsed.escalationRisk,
      sentiment: parsed.sentiment,
      priority: parsed.priority,
      suggestedTags: Array.isArray(parsed.suggestedTags)
        ? parsed.suggestedTags.map((tag) => String(tag).trim()).filter(Boolean)
        : [],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
    };
  } catch {
    return null;
  }
}

export async function analyzeComplaintWithOllama(input: {
  title: string;
  category: string;
  description: string;
  department: string;
  city?: string;
  district?: string;
}) {
  const baseUrl = env.OLLAMA_BASE_URL.replace(/\/$/, "");
  const prompt = [
    "You are the AI intelligence engine for Civic Bridge Flow.",
    "Analyze the complaint and respond with strict JSON only.",
    "Required keys: summary, urgency, department, escalationRisk, sentiment, priority, suggestedTags, draftReply, confidence.",
    "Allowed urgency values: low, medium, high, critical.",
    "Allowed escalationRisk values: low, medium, high.",
    "Allowed sentiment values: positive, neutral, negative.",
    "Allowed priority values: Low, Medium, High, Critical.",
    "Keep the summary concise, operational, and suitable for an officer command center.",
    `Title: ${input.title}`,
    `Category: ${input.category}`,
    `Department: ${input.department}`,
    `Location: ${[input.city, input.district].filter(Boolean).join(", ") || "Unknown"}`,
    `Description: ${input.description}`,
  ].join("\n");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.OLLAMA_TIMEOUT_MS);

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        prompt,
        stream: false,
        format: "json",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return fallbackComplaintIntelligence(input);
    }

    const payload = (await response.json().catch(() => null)) as { response?: string } | null;
    const parsed = payload?.response ? parseInsightPayload(payload.response) : null;

    return parsed ?? fallbackComplaintIntelligence(input);
  } catch {
    return fallbackComplaintIntelligence(input);
  }
}