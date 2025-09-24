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

    // Automatically generate notes for Datacenter, Hosts, VMs, and LXCs on startup
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
    new Notice('Generating Proxmox notes for Datacenter, Hosts, VMs, and LXCs...');
    try {
      const datacenterSuccess = await this.proxmoxClient.createNoteForDatacenter(targetDir);
      const hostCount = await this.proxmoxClient.createNotesForHosts(targetDir);
      const vmCount = await this.proxmoxClient.createNotesForVMs(targetDir);
      const lxcCount = await this.proxmoxClient.createNotesForLXCs(targetDir);
      if (datacenterSuccess) new Notice('Proxmox Datacenter note created/updated.');
      new Notice(`Proxmox Host notes created/updated: ${hostCount}`);
      new Notice(`Proxmox VM notes created/updated: ${vmCount}`);
      new Notice(`Proxmox LXC notes created/updated: ${lxcCount}`);
    } catch (err) {
      console.error('Failed to create Proxmox notes:', err);
      new Notice('Failed to create Proxmox notes. See console for details.');
    }

    // Add commands to generate notes for Datacenter, Hosts, VMs, and LXCs
    this.addCommand({
      id: 'generate-proxmox-datacenter-note',
      name: 'Generate Proxmox Datacenter Note',
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
        new Notice('Generating Proxmox Datacenter note...');
        try {
          const success = await this.proxmoxClient.createNoteForDatacenter(targetDir);
          if (success) {
            new Notice('Proxmox Datacenter note created/updated.');
          } else {
            new Notice('Failed to create Proxmox Datacenter note.');
          }
        } catch (err) {
          console.error('Failed to create Proxmox Datacenter note:', err);
          new Notice('Failed to create Proxmox Datacenter note. See console for details.');
        }
      },
    });
    this.addCommand({
      id: 'generate-proxmox-host-notes',
      name: 'Generate Proxmox Host Notes',
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
        new Notice('Generating Proxmox Host notes...');
        try {
          const hostCount = await this.proxmoxClient.createNotesForHosts(targetDir);
          new Notice(`Proxmox Host notes created/updated: ${hostCount}.`);
        } catch (err) {
          console.error('Failed to create Proxmox Host notes:', err);
          new Notice('Failed to create Proxmox Host notes. See console for details.');
        }
      },
    });
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
          const vmCount = await this.proxmoxClient.createNotesForVMs(targetDir);
          new Notice(`Proxmox VM notes created/updated: ${vmCount}.`);
        } catch (err) {
          console.error('Failed to create Proxmox VM notes:', err);
          new Notice('Failed to create Proxmox VM notes. See console for details.');
        }
      },
    });
    this.addCommand({
      id: 'generate-proxmox-lxc-notes',
      name: 'Generate Proxmox LXC Notes',
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
        new Notice('Generating Proxmox LXC notes...');
        try {
          const lxcCount = await this.proxmoxClient.createNotesForLXCs(targetDir);
          new Notice(`Proxmox LXC notes created/updated: ${lxcCount}.`);
        } catch (err) {
          console.error('Failed to create Proxmox LXC notes:', err);
          new Notice('Failed to create Proxmox LXC notes. See console for details.');
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
