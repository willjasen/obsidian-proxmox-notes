// src/ProxmoxClient.ts
import axios, { AxiosInstance } from 'axios';

export class ProxmoxClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string, token: string) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        Authorization: `PVEAPIToken=YOURUSER@YOURREALM!YOURTOKENID=${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Example: Fetch VMs
  async getVMs(node: string) {
    const response = await this.axiosInstance.get(`/api2/json/nodes/${node}/qemu`);
    return response.data.data;
  }

  // Example: Fetch VM Notes
  async getVMNotes(node: string, vmId: number) {
    const response = await this.axiosInstance.get(`/api2/json/nodes/${node}/qemu/${vmId}/config`);
    return response.data.data.notes;
  }

  // Example: Update VM Notes
  async updateVMNotes(node: string, vmId: number, notes: string) {
    const response = await this.axiosInstance.put(`/api2/json/nodes/${node}/qemu/${vmId}/config`, {
      notes,
    });
    return response.data;
  }

  // Similar methods for Containers
  async getContainers(node: string) { /* ... */ }
  async getContainerNotes(node: string, containerId: number) { /* ... */ }
  async updateContainerNotes(node: string, containerId: number, notes: string) { /* ... */ }
}
