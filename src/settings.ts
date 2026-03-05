import { App, PluginSettingTab, Setting } from 'obsidian';
import BaseSettingsPlugin from './main';

export interface BaseSettingsPluginSettings {
	baseTemplatesPath: string;
	debounceInterval: number;
}

export const DEFAULT_SETTINGS: BaseSettingsPluginSettings = {
	baseTemplatesPath: '',
	debounceInterval: 500,
}

export class BaseSettingsSettingTab extends PluginSettingTab {
	plugin: BaseSettingsPlugin;

	constructor(app: App, plugin: BaseSettingsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Base templates path')
			.setDesc('Folder containing base template JSON files, relative to .obsidian/ (e.g. base-settings)')
			.addText(text => text
				.setPlaceholder('base-settings')
				.setValue(this.plugin.settings.baseTemplatesPath)
				.onChange(async (value) => {
					this.plugin.settings.baseTemplatesPath = value.trim();
					await this.plugin.saveSettings();
					await this.plugin.sync();
				}));

		new Setting(containerEl)
			.setName('Debounce interval')
			.setDesc('Milliseconds to wait after a file change before running a sync (default: 500)')
			.addText(text => text
				.setPlaceholder('500')
				.setValue(String(this.plugin.settings.debounceInterval))
				.onChange(async (value) => {
					const parsed = parseInt(value, 10);
					if (!isNaN(parsed) && parsed >= 0) {
						this.plugin.settings.debounceInterval = parsed;
						await this.plugin.saveSettings();
					}
				}));
	}
}
