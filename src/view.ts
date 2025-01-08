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
    const node = 'pve1'; // Replace with actual node or make it dynamic
    const vms = await this.proxmoxClient.getVMs(node);
    const vmList = container.createEl('ul');
    vms.forEach((vm: any) => {
      const vmItem = vmList.createEl('li', { text: `VM ${vm.vmid}: ${vm.name}` });
      vmItem.onclick = () => this.openVMNotes(node, vm.vmid);
    });

    // Similarly, list containers
  }

  async openVMNotes(node: string, vmId: number) {
    const notes = await this.proxmoxClient.getVMNotes(node, vmId);
    const editor = this.containerEl.createEl('textarea', { text: notes });
    const saveButton = this.containerEl.createEl('button', { text: 'Save Notes' });

    saveButton.onclick = async () => {
      const updatedNotes = editor.value;
      await this.proxmoxClient.updateVMNotes(node, vmId, updatedNotes);
      new Notice('VM notes updated successfully!');
    };
  }

  async onClose() {
    // Cleanup if necessary
  }
}
