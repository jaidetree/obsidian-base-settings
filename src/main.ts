import { Events, Plugin, normalizePath } from "obsidian";
import {
	BaseSettingsPluginSettings,
	DEFAULT_SETTINGS,
	BaseSettingsSettingTab,
} from "./settings";
import { deepMerge } from "./merge";

export default class BaseSettingsPlugin extends Plugin {
	settings: BaseSettingsPluginSettings;

	private isSyncing = false;
	private templatesDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	private obsidianDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new BaseSettingsSettingTab(this.app, this));
		this.addCommand({
			id: "sync",
			name: "Sync settings",
			callback: () => {
				void this.sync();
			},
		});
		this.registerWatchers();
		await this.sync();
	}

	onunload() {
		if (this.templatesDebounceTimer)
			clearTimeout(this.templatesDebounceTimer);
		if (this.obsidianDebounceTimer)
			clearTimeout(this.obsidianDebounceTimer);
	}

	private get templatesDir(): string | null {
		const { baseTemplatesPath } = this.settings;
		if (!baseTemplatesPath) return null;
		return normalizePath(
			`${this.app.vault.configDir}/${baseTemplatesPath}`,
		);
	}

	private registerWatchers() {
		// 'raw' fires for any filesystem change including config dir files;
		// it exists at runtime but is not in Obsidian's public type definitions
		this.registerEvent(
			(this.app.vault as unknown as Events).on("raw", (path: string) => {
				if (!path.endsWith(".json")) return;

				const configDir = this.app.vault.configDir;
				const { templatesDir } = this;

				// $baseTemplates watcher: any change inside the templates folder
				if (templatesDir && path.startsWith(templatesDir + "/")) {
					this.scheduleSync("templates");
					return;
				}

				// config dir watcher: .json files directly in the config dir (not in subfolders)
				// Ignore events fired during a sync to prevent feedback loop
				const inConfigRoot =
					path.startsWith(configDir + "/") &&
					!path.slice(configDir.length + 1).includes("/");
				if (inConfigRoot && !this.isSyncing) {
					this.scheduleSync("obsidian");
				}
			}),
		);
	}

	private scheduleSync(source: "templates" | "obsidian") {
		const timerKey =
			source === "templates"
				? "templatesDebounceTimer"
				: "obsidianDebounceTimer";
		const existing = this[timerKey];
		if (existing) clearTimeout(existing);
		this[timerKey] = setTimeout(() => {
			this[timerKey] = null;
			void this.sync();
		}, this.settings.debounceInterval);
	}

	async sync() {
		const { templatesDir } = this;
		if (!templatesDir) return;

		// The Vault API only exposes TFile objects for vault content, not config dir
		// files. The adapter is used here intentionally to access .obsidian/ directly.
		const adapter = this.app.vault.adapter;
		const configDir = this.app.vault.configDir;

		if (!(await adapter.exists(templatesDir))) return;

		this.isSyncing = true;
		try {
			const listing = await adapter.list(templatesDir);
			for (const templatePath of listing.files) {
				if (!templatePath.endsWith(".json")) continue;

				const filename = templatePath.split("/").pop()!;
				const targetPath = normalizePath(`${configDir}/${filename}`);

				if (!(await adapter.exists(targetPath))) continue;

				const [templateContent, targetContent] = await Promise.all([
					adapter.read(templatePath),
					adapter.read(targetPath),
				]);

				const templateJson = JSON.parse(templateContent) as unknown;
				const targetJson = JSON.parse(targetContent) as unknown;

				const isObject = (v: unknown): v is Record<string, unknown> =>
					typeof v === 'object' && v !== null && !Array.isArray(v);
				const isArray = (v: unknown): v is unknown[] => Array.isArray(v);

				let merged: unknown;
				if (isArray(templateJson) && isArray(targetJson)) {
					merged = [...new Set([...templateJson, ...targetJson])];
				} else if (isObject(templateJson) && isObject(targetJson)) {
					merged = deepMerge(targetJson, templateJson);
				} else {
					merged = templateJson;
				}
				await adapter.write(
					targetPath,
					JSON.stringify(merged, null, "\t"),
				);
			}
		} finally {
			this.isSyncing = false;
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<BaseSettingsPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
