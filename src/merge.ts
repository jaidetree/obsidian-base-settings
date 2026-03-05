export function deepMerge(
	target: Record<string, unknown>,
	source: Record<string, unknown>
): Record<string, unknown> {
	const result: Record<string, unknown> = { ...target };
	for (const key of Object.keys(source)) {
		const sourceVal = source[key];
		const targetVal = result[key];
		if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
			result[key] = deepMerge(
				targetVal as Record<string, unknown>,
				sourceVal as Record<string, unknown>
			);
		} else {
			result[key] = sourceVal;
		}
	}
	return result;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
	return typeof val === 'object' && val !== null && !Array.isArray(val);
}
