// src/settings.ts
import { App, PluginSettingTab, Setting } from 'obsidian';
import ProxmoxPlugin from './main';

export interface ProxmoxPluginSettings {
  baseUrl: string;
  apiToken: string;
  notesDirectory: string; // New setting for notes directory
}

export const DEFAULT_SETTINGS: ProxmoxPluginSettings = {
  baseUrl: 'https://your-proxmox-server:8006/api2/json',
  apiToken: '',
  notesDirectory: '', // default to root
};

export class ProxmoxSettingTab extends PluginSettingTab {
  plugin: ProxmoxPlugin;

  constructor(app: App, plugin: ProxmoxPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Proxmox Plugin Settings' });

    new Setting(containerEl)
      .setName('Proxmox API Base URL')
      .setDesc('The base URL for your Proxmox API, e.g., https://your-proxmox-server:8006')
      .addText(text => text
        .setPlaceholder('https://your-proxmox-server:8006/api2/json')
        .setValue(this.plugin.settings.baseUrl)
        .onChange(async (value) => {
          this.plugin.settings.baseUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Proxmox API Token')
      .setDesc('Your Proxmox API token in the format USER@REALM!TOKENID=TOKENVALUE')
      .addText(text => text
        .setPlaceholder('USER@REALM!TOKENID=TOKENVALUE')
        .setValue(this.plugin.settings.apiToken)
        .onChange(async (value) => {
          this.plugin.settings.apiToken = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Notes Directory')
      .setDesc('Directory (relative to vault root) where notes will be created. Leave blank for root (/).')
      .addText(text => text
        .setPlaceholder('e.g. ProxmoxVMs')
        .setValue(this.plugin.settings.notesDirectory || '')
        .onChange(async (value) => {
          this.plugin.settings.notesDirectory = value.trim();
          await this.plugin.saveSettings();
        }));
  }
}

export {};
