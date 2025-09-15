import { Request, Response, NextFunction } from 'express';

function parseCsv(value?: string | null): string[] {
	return (value || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}

export function isFeatureEnabled(flag: string): boolean {
	const flags = parseCsv(process.env.FEATURE_FLAGS);
	return flags.includes(flag);
}

export function requireFeatureFlag(flag: string) {
	return (_req: Request, res: Response, next: NextFunction) => {
		if (!isFeatureEnabled(flag)) {
			return res.status(403).json({ error: 'feature_disabled', flag });
		}
		return next();
	};
}

export function requireAllowlist(req: Request, res: Response, next: NextFunction) {
	const allowedUsers = parseCsv(process.env.ALLOWLIST_USERS);
	const allowedWards = parseCsv(process.env.ALLOWLIST_WARDS);

	// If no allowlist configured, allow
	if (allowedUsers.length === 0 && allowedWards.length === 0) {
		return next();
	}

	const userId = (req as any).user?.userId as string | undefined;
	if (userId && allowedUsers.includes(userId)) {
		return next();
	}

	const wardHeader = (req.header('x-ward') || (req.query.ward as string | undefined) || '').trim();
	if (allowedWards.length > 0 && wardHeader && allowedWards.includes(wardHeader)) {
		return next();
	}

	return res.status(403).json({ error: 'not_in_allowlist' });
}

