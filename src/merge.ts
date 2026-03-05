interface MergeDirective {
	value: unknown;
	__mergeDirective: { strategy: 'replace' | 'concat' };
}

function isMergeDirective(val: unknown): val is MergeDirective {
	return isPlainObject(val) && '__mergeDirective' in val;
}

function getType(val: unknown): string {
	if (val === null) return 'null';
	if (Array.isArray(val)) return 'array';
	return typeof val;
}

function applyStrategy(directive: MergeDirective, targetVal: unknown): unknown {
	const { strategy } = directive.__mergeDirective;
	if (strategy === 'concat') {
		return [...(directive.value as unknown[]), ...(targetVal as unknown[])];
	}
	return directive.value;
}

export function deepMerge(
	target: Record<string, unknown>,
	source: Record<string, unknown>
): Record<string, unknown> {
	const result: Record<string, unknown> = { ...target };
	for (const key of Object.keys(source)) {
		const sourceVal = source[key];
		const targetVal = result[key];
		if (isMergeDirective(sourceVal)) {
			if (targetVal === undefined || getType(sourceVal.value) !== getType(targetVal)) {
				throw new Error(
					`Type mismatch at "${key}": cannot merge ${getType(sourceVal.value)} into ${getType(targetVal)}`
				);
			}
			result[key] = applyStrategy(sourceVal, targetVal);
		} else {
			if (targetVal !== undefined && getType(sourceVal) !== getType(targetVal)) {
				throw new Error(
					`Type mismatch at "${key}": cannot merge ${getType(sourceVal)} into ${getType(targetVal)}`
				);
			}
			if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
				result[key] = deepMerge(targetVal, sourceVal);
			} else {
				result[key] = sourceVal;
			}
		}
	}
	return result;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
	return typeof val === 'object' && val !== null && !Array.isArray(val);
}
