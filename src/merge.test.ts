import { describe, expect, it } from 'vitest';
import { deepMerge } from './merge';

describe('deepMerge', () => {
	describe('basic behaviour', () => {
		it('adds keys from source that are not in target', () => {
			const result = deepMerge({ a: 1 }, { b: 2 });
			expect(result).toEqual({ a: 1, b: 2 });
		});

		it('preserves target keys not present in source', () => {
			const result = deepMerge({ a: 1, b: 2 }, { b: 99 });
			expect(result).toEqual({ a: 1, b: 99 });
		});

		it('returns a copy of target when source is empty', () => {
			const target = { a: 1 };
			const result = deepMerge(target, {});
			expect(result).toEqual({ a: 1 });
		});

		it('returns source keys when target is empty', () => {
			const result = deepMerge({}, { a: 1 });
			expect(result).toEqual({ a: 1 });
		});

		it('returns empty object when both are empty', () => {
			expect(deepMerge({}, {})).toEqual({});
		});
	});

	describe('conflict resolution', () => {
		it('source wins over target on scalar conflict', () => {
			const result = deepMerge({ a: 'user' }, { a: 'base' });
			expect(result.a).toBe('base');
		});

		it('source null replaces target value throws on type mismatch', () => {
			expect(() => deepMerge({ a: 'user' }, { a: null })).toThrow('Type mismatch at "a"');
		});

		it('source false replaces target true', () => {
			const result = deepMerge({ a: true }, { a: false });
			expect(result.a).toBe(false);
		});

		it('source zero replaces target number', () => {
			const result = deepMerge({ a: 42 }, { a: 0 });
			expect(result.a).toBe(0);
		});

		it('source primitive replaces target object throws on type mismatch', () => {
			expect(() => deepMerge({ a: { nested: true } }, { a: 'flat' })).toThrow('Type mismatch at "a"');
		});

		it('source object replaces target primitive throws on type mismatch', () => {
			expect(() => deepMerge({ a: 'flat' }, { a: { nested: true } })).toThrow('Type mismatch at "a"');
		});
	});

	describe('deep merging', () => {
		it('recursively merges nested objects', () => {
			const target = { settings: { theme: 'light', fontSize: 14 } };
			const source = { settings: { theme: 'dark' } };
			const result = deepMerge(target, source);
			expect(result).toEqual({ settings: { theme: 'dark', fontSize: 14 } });
		});

		it('source wins on nested key conflict', () => {
			const target = { ui: { spellcheck: false, vimMode: false } };
			const source = { ui: { spellcheck: true } };
			const result = deepMerge(target, source);
			expect(result).toEqual({ ui: { spellcheck: true, vimMode: false } });
		});

		it('merges multiple levels deep', () => {
			const target = { a: { b: { c: 'user', d: 'keep' } } };
			const source = { a: { b: { c: 'base' } } };
			const result = deepMerge(target, source);
			expect(result).toEqual({ a: { b: { c: 'base', d: 'keep' } } });
		});

		it('adds deeply nested source keys not present in target', () => {
			const target = { a: { existing: true } };
			const source = { a: { existing: true, added: 'new' } };
			const result = deepMerge(target, source);
			expect(result).toEqual({ a: { existing: true, added: 'new' } });
		});
	});

	describe('array handling', () => {
		it('source array replaces target array', () => {
			const result = deepMerge({ plugins: ['a', 'b'] }, { plugins: ['c'] });
			expect(result.plugins).toEqual(['c']);
		});

		it('source array replaces target object throws on type mismatch', () => {
			expect(() => deepMerge({ a: { nested: true } }, { a: ['x'] })).toThrow('Type mismatch at "a"');
		});

		it('source object replaces target array throws on type mismatch', () => {
			expect(() => deepMerge({ a: [1, 2] }, { a: { nested: true } })).toThrow('Type mismatch at "a"');
		});

		it('does not concatenate arrays', () => {
			const result = deepMerge({ a: [1, 2, 3] }, { a: [4, 5] });
			expect(result.a).toEqual([4, 5]);
		});
	});

	describe('merge directives', () => {
		it('replace strategy replaces the target value', () => {
			const result = deepMerge(
				{ plugins: ['user-plugin'] },
				{ plugins: { value: ['required-plugin'], __mergeDirective: { strategy: 'replace' } } }
			);
			expect(result.plugins).toEqual(['required-plugin']);
		});

		it('concat strategy prepends base array before target array', () => {
			const result = deepMerge(
				{ plugins: ['user-plugin'] },
				{ plugins: { value: ['required-plugin'], __mergeDirective: { strategy: 'concat' } } }
			);
			expect(result.plugins).toEqual(['required-plugin', 'user-plugin']);
		});

		it('concat when target is not an array throws on type mismatch', () => {
			expect(() => deepMerge(
				{ plugins: 'not-an-array' },
				{ plugins: { value: ['required-plugin'], __mergeDirective: { strategy: 'concat' } } }
			)).toThrow('Type mismatch at "plugins"');
		});

		it('concat when value is not an array throws on type mismatch', () => {
			expect(() => deepMerge(
				{ plugins: ['user-plugin'] },
				{ plugins: { value: 'required-plugin', __mergeDirective: { strategy: 'concat' } } }
			)).toThrow('Type mismatch at "plugins"');
		});

		it('directive when target key does not exist throws', () => {
			expect(() => deepMerge(
				{},
				{ plugins: { value: ['required-plugin'], __mergeDirective: { strategy: 'concat' } } }
			)).toThrow('Type mismatch at "plugins"');
		});

		it('directive nested inside a deeper object works correctly', () => {
			const result = deepMerge(
				{ ui: { plugins: ['user-plugin'] } },
				{ ui: { plugins: { value: ['required-plugin'], __mergeDirective: { strategy: 'concat' } } } }
			);
			expect(result).toEqual({ ui: { plugins: ['required-plugin', 'user-plugin'] } });
		});

		it('concat unique: true removes duplicates present in both value and target', () => {
			const result = deepMerge(
				{ plugins: ['b', 'c'] },
				{ plugins: { value: ['a', 'b'], __mergeDirective: { strategy: 'concat', unique: true } } }
			);
			expect(result.plugins).toEqual(['a', 'b', 'c']);
		});

		it('concat unique: true preserves value items when duplicated within target', () => {
			const result = deepMerge(
				{ plugins: ['b', 'c'] },
				{ plugins: { value: ['a', 'b'], __mergeDirective: { strategy: 'concat', unique: true } } }
			);
			expect(result.plugins).toEqual(['a', 'b', 'c']);
		});

		it('concat unique: false does not deduplicate', () => {
			const result = deepMerge(
				{ plugins: ['b', 'c'] },
				{ plugins: { value: ['a', 'b'], __mergeDirective: { strategy: 'concat', unique: false } } }
			);
			expect(result.plugins).toEqual(['a', 'b', 'b', 'c']);
		});

		it('concat without unique does not deduplicate', () => {
			const result = deepMerge(
				{ plugins: ['b', 'c'] },
				{ plugins: { value: ['a', 'b'], __mergeDirective: { strategy: 'concat' } } }
			);
			expect(result.plugins).toEqual(['a', 'b', 'b', 'c']);
		});

		it('replace unique: true deduplicates value array', () => {
			const result = deepMerge(
				{ plugins: ['x'] },
				{ plugins: { value: ['a', 'b', 'a'], __mergeDirective: { strategy: 'replace', unique: true } } }
			);
			expect(result.plugins).toEqual(['a', 'b']);
		});

		it('plain object without __mergeDirective is NOT treated as a directive', () => {
			const result = deepMerge(
				{ settings: { a: 1, b: 2 } },
				{ settings: { a: 99 } }
			);
			expect(result.settings).toEqual({ a: 99, b: 2 });
		});
	});

	describe('immutability', () => {
		it('does not mutate the target object', () => {
			const target = { a: 1, b: { c: 2 } };
			deepMerge(target, { a: 99, b: { c: 99 } });
			expect(target).toEqual({ a: 1, b: { c: 2 } });
		});

		it('does not mutate the source object', () => {
			const source = { a: 99, b: { c: 99 } };
			deepMerge({ a: 1, b: { c: 2 } }, source);
			expect(source).toEqual({ a: 99, b: { c: 99 } });
		});
	});
});
