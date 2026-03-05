import { Plugin } from 'obsidian';
import { BaseSettingsPluginSettings, DEFAULT_SETTINGS, BaseSettingsSettingTab } from './settings';

export default class BaseSettingsPlugin extends Plugin {
	settings: BaseSettingsPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new BaseSettingsSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<BaseSettingsPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
