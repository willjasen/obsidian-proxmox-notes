// src/ProxmoxClient.ts
import * as https from 'https';
import { IncomingMessage } from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ProxmoxClient {
  private baseUrl: string;
  private apiToken: string;

  constructor(baseUrl: string, apiToken: string) {
    this.baseUrl = baseUrl;
    this.apiToken = apiToken;
  }

  async getVMs(): Promise<any[]> {
    const url = `${this.baseUrl}/api2/json/cluster/resources?type=vm`;

    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        headers: {
          'Authorization': `PVEAPIToken=${this.apiToken}`,
          'Accept': 'application/json',
        },
      };

      const req = https.request(url, options, (res: IncomingMessage) => {
        let data = '';

        // Collect response data
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });

        // Resolve the promise when the response ends
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);
              if (Array.isArray(parsedData.data)) {
                const validVMs = parsedData.data.filter((vm: any) => vm !== undefined && vm !== null && vm.status !== 'unknown');
                resolve(validVMs);
              } else {
                console.error('Unexpected response format. Full response:', parsedData); // Log unexpected response format
                reject(new Error('Unexpected response format: data is not an array.'));
              }
            } catch (error) {
              console.error('Error parsing JSON response:', error); // Log JSON parsing errors
              reject(new Error('Failed to parse JSON response.'));
            }
          } else {
            console.error(`Request failed with status code ${res.statusCode}. Response:`, data); // Log failed request details
            reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
          }
        });
      });

      // Handle request errors
      req.on('error', (error: Error) => {
        console.error('Network error:', error.message); // Log network errors
        reject(new Error(`Network error: ${error.message}`));
      });

      req.end();
    });
  }

  async createNotesForVMs(vaultRoot: string): Promise<void> {
    console.log('Starting createNotesForVMs...');
    try {
      const vms = await this.getVMs();
      console.log(`Found ${vms.length} VMs.`);
      for (const vm of vms) {
        console.log(`Creating note for VMID: ${vm.vmid}, Name: ${vm.name || ''}`);
        const noteContent = `# VM: ${vm.name || vm.vmid}\n\n- **VMID:** ${vm.vmid}\n- **Name:** ${vm.name || ''}\n- **Status:** ${vm.status}\n- **Node:** ${vm.node}\n- **Type:** ${vm.type}\n- **Max Memory:** ${vm.maxmem}\n- **Max Disk:** ${vm.maxdisk}\n- **CPUs:** ${vm.cpus}\n`;
        const fileName = `VM ${vm.vmid} -- ${(vm.name || '').replace(/[^a-zA-Z0-9-_]/g, '_')}.md`;
        const filePath = path.join(vaultRoot, fileName);
        await fs.writeFile(filePath, noteContent, 'utf8');
        console.log(`Created note: ${filePath}`);
      }
      console.log('All VM notes created.');
    } catch (err) {
      console.error('Error creating VM notes:', err);
    }
  }
}
