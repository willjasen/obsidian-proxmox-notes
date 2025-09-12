// src/view.ts
import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { ProxmoxClient } from './ProxmoxClient';

export const VIEW_TYPE_PROXMOX = 'proxmox-view';

export class ProxmoxView extends ItemView {
  private proxmoxClient: ProxmoxClient;

  constructor(leaf: WorkspaceLeaf, proxmoxClient: ProxmoxClient) {
    super(leaf);
    this.proxmoxClient = proxmoxClient;
  }

  getViewType() {
    return VIEW_TYPE_PROXMOX;
  }

  getDisplayText() {
    return 'Proxmox VMs & Containers';
  }

  async onOpen() {
    const container = this.containerEl;
    container.empty();

    // Fetch and display VMs
    const vms = await this.proxmoxClient.getVMs();
    const vmList = container.createEl('ul');
    vms.forEach((vm: any) => {
      const vmItem = vmList.createEl('li', { text: `VM ${vm.vmid}: ${vm.name}` });
      // You can add click handlers here if you implement note viewing/updating
    });
    // Similarly, list containers
  }

  // Removed openVMNotes: getVMNotes and updateVMNotes are not implemented in ProxmoxClient

  async onClose() {
    // Cleanup if necessary
  }
}
