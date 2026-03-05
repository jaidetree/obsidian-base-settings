import { Events, Plugin } from 'obsidian';
import { BaseSettingsPluginSettings, DEFAULT_SETTINGS, BaseSettingsSettingTab } from './settings';
import { deepMerge } from './merge';

export default class BaseSettingsPlugin extends Plugin {
	settings: BaseSettingsPluginSettings;

	private isSyncing = false;
	private templatesDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	private obsidianDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new BaseSettingsSettingTab(this.app, this));
		this.addCommand({
			id: 'sync-base-settings',
			name: 'Sync settings',
			callback: () => { void this.sync(); },
		});
		this.registerWatchers();
		await this.sync();
	}

	onunload() {
		if (this.templatesDebounceTimer) clearTimeout(this.templatesDebounceTimer);
		if (this.obsidianDebounceTimer) clearTimeout(this.obsidianDebounceTimer);
	}

	private registerWatchers() {
		// 'raw' fires for any filesystem change including config dir files;
		// it exists at runtime but is not in Obsidian's public type definitions
		this.registerEvent(
			(this.app.vault as unknown as Events).on('raw', (path: string) => {
				if (!path.endsWith('.json')) return;

				const configDir = this.app.vault.configDir;
				const { baseTemplatesPath } = this.settings;
				const templatesDir = baseTemplatesPath
					? `${configDir}/${baseTemplatesPath}`
					: null;

				// $baseTemplates watcher: any change inside the templates folder
				if (templatesDir && path.startsWith(templatesDir + '/')) {
					this.schedulSync('templates');
					return;
				}

				// config dir watcher: .json files directly in the config dir (not in subfolders)
				// Ignore events fired during a sync to prevent feedback loop
				const inConfigRoot = path.startsWith(configDir + '/') &&
					!path.slice(configDir.length + 1).includes('/');
				if (inConfigRoot && !this.isSyncing) {
					this.schedulSync('obsidian');
				}
			})
		);
	}

	private schedulSync(source: 'templates' | 'obsidian') {
		const timerKey = source === 'templates' ? 'templatesDebounceTimer' : 'obsidianDebounceTimer';
		const existing = this[timerKey];
		if (existing) clearTimeout(existing);
		this[timerKey] = setTimeout(() => {
			this[timerKey] = null;
			void this.sync();
		}, this.settings.debounceInterval);
	}

	async sync() {
		const { baseTemplatesPath } = this.settings;
		if (!baseTemplatesPath) return;

		const adapter = this.app.vault.adapter;
		const configDir = this.app.vault.configDir;
		const templatesDir = `${configDir}/${baseTemplatesPath}`;

		if (!(await adapter.exists(templatesDir))) return;

		this.isSyncing = true;
		try {
			const listing = await adapter.list(templatesDir);
			for (const templatePath of listing.files) {
				if (!templatePath.endsWith('.json')) continue;

				const filename = templatePath.split('/').pop()!;
				const targetPath = `${configDir}/${filename}`;

				if (!(await adapter.exists(targetPath))) {
					console.debug(`[Base Settings] skipped ${filename} (target does not exist yet)`);
					continue;
				}

				const [templateContent, targetContent] = await Promise.all([
					adapter.read(templatePath),
					adapter.read(targetPath),
				]);

				const templateJson = JSON.parse(templateContent) as Record<string, unknown>;
				const targetJson = JSON.parse(targetContent) as Record<string, unknown>;

				const merged = deepMerge(targetJson, templateJson);
				await adapter.write(targetPath, JSON.stringify(merged, null, '\t'));
				console.debug(`[Base Settings] merged ${filename}`);
			}
		} finally {
			this.isSyncing = false;
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<BaseSettingsPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
