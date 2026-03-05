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
	}
}
