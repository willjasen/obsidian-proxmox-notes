// src/main.ts
import { Plugin, Notice, FileSystemAdapter } from 'obsidian';
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

    // Automatically generate notes for VMs and LXCs on startup
    const adapter = this.app.vault.adapter;
    let vaultRoot: string;
    if (adapter instanceof FileSystemAdapter) {
      vaultRoot = adapter.getBasePath();
    } else {
      new Notice('Vault adapter is not a FileSystemAdapter. Cannot determine base path.');
      return;
    }
    let notesDir = this.settings.notesDirectory?.trim() || '';
    let targetDir = notesDir ? require('path').join(vaultRoot, notesDir) : vaultRoot;
    new Notice('Generating Proxmox VM and LXC notes...');
    try {
      await this.proxmoxClient.createNotesForVMs(targetDir);
      await this.proxmoxClient.createNotesForLXCs(targetDir);
      new Notice('Proxmox VM and LXC notes created!');
    } catch (err) {
      console.error('Failed to create Proxmox notes:', err);
      new Notice('Failed to create Proxmox notes. See console for details.');
    }

    // Add command to generate VM notes
    this.addCommand({
      id: 'generate-proxmox-vm-notes',
      name: 'Generate Proxmox VM Notes',
      callback: async () => {
        const adapter = this.app.vault.adapter;
        let vaultRoot: string;
        if (adapter instanceof FileSystemAdapter) {
          vaultRoot = adapter.getBasePath();
        } else {
          new Notice('Vault adapter is not a FileSystemAdapter. Cannot determine base path.');
          return;
        }
        let notesDir = this.settings.notesDirectory?.trim() || '';
        let targetDir = notesDir ? require('path').join(vaultRoot, notesDir) : vaultRoot;
        new Notice('Generating Proxmox VM notes...');
        try {
          await this.proxmoxClient.createNotesForVMs(targetDir);
          new Notice('Proxmox VM notes created!');
        } catch (err) {
          console.error('Failed to create Proxmox VM notes:', err);
          new Notice('Failed to create Proxmox VM notes. See console for details.');
        }
      },
    });
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
