// src/main.ts
import { Plugin } from 'obsidian';
import { ProxmoxSettingTab, DEFAULT_SETTINGS, ProxmoxPluginSettings } from './settings';
import { ProxmoxView, VIEW_TYPE_PROXMOX } from './src/view';
import { ProxmoxClient } from './src/ProxmoxClient';

export default class ProxmoxPlugin extends Plugin {
  settings: ProxmoxPluginSettings;
  proxmoxClient: ProxmoxClient;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new ProxmoxSettingTab(this.app, this));

    this.registerView(
      VIEW_TYPE_PROXMOX,
      (leaf) => new ProxmoxView(leaf, this.proxmoxClient)
    );

    this.addRibbonIcon('server', 'Open Proxmox View', () => {
      this.activateView();
    });

    // Initialize ProxmoxClient
    this.proxmoxClient = new ProxmoxClient(this.settings.baseUrl, this.settings.apiToken);
  }

  onunload() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_PROXMOX).forEach(leaf => leaf.detach());
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  activateView() {
    const rightLeaf = this.app.workspace.getRightLeaf(false);
    if (rightLeaf) {
      rightLeaf.setViewState({
        type: VIEW_TYPE_PROXMOX,
        active: true,
      });
      this.app.workspace.revealLeaf(
        this.app.workspace.getLeavesOfType(VIEW_TYPE_PROXMOX)[0]
      );
    }
  }
}
