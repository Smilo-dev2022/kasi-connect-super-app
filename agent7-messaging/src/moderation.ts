// Lightweight moderation classification utility (copy of app/lib for service-local use)
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ClassificationResult {
	category: string;
	severity: SeverityLevel;
	confidence: number; // 0..1
}

export async function classifyContent(text: string): Promise<ClassificationResult> {
	const normalized = text.toLowerCase();
	const isThreat = /(kill|harm|bomb|attack)/.test(normalized);
	const isHate = /(hate|slur|racist|xenophob(e|ic)|homophob(e|ic))/i.test(normalized);
	const isSpam = /(free money|click here|loan|crypto)/.test(normalized);

	let category = 'other';
	let severity: SeverityLevel = 'low';
	let confidence = 0.4;

	if (isThreat) {
		category = 'threats';
		severity = 'critical';
		confidence = 0.9;
	} else if (isHate) {
		category = 'hate_speech';
		severity = 'high';
		confidence = 0.85;
	} else if (isSpam) {
		category = 'spam';
		severity = 'medium';
		confidence = 0.7;
	}

	return { category, severity, confidence };
}

