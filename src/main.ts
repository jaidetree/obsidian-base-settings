import { Plugin } from 'obsidian';
import { BaseSettingsPluginSettings, DEFAULT_SETTINGS, BaseSettingsSettingTab } from './settings';
import { deepMerge } from './merge';

export default class BaseSettingsPlugin extends Plugin {
	settings: BaseSettingsPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new BaseSettingsSettingTab(this.app, this));
		await this.sync();
	}

	onunload() {
	}

	async sync() {
		const { baseTemplatesPath } = this.settings;
		if (!baseTemplatesPath) return;

		const adapter = this.app.vault.adapter;
		const configDir = this.app.vault.configDir;
		const templatesDir = `${configDir}/${baseTemplatesPath}`;

		if (!(await adapter.exists(templatesDir))) return;

		const listing = await adapter.list(templatesDir);
		for (const templatePath of listing.files) {
			if (!templatePath.endsWith('.json')) continue;

			const filename = templatePath.split('/').pop()!;
			const targetPath = `${configDir}/${filename}`;

			if (!(await adapter.exists(targetPath))) continue;

			const [templateContent, targetContent] = await Promise.all([
				adapter.read(templatePath),
				adapter.read(targetPath),
			]);

			const templateJson = JSON.parse(templateContent) as Record<string, unknown>;
			const targetJson = JSON.parse(targetContent) as Record<string, unknown>;

			const merged = deepMerge(targetJson, templateJson);
			await adapter.write(targetPath, JSON.stringify(merged, null, '\t'));
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<BaseSettingsPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
