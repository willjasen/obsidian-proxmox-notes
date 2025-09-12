// src/ProxmoxClient.ts
import * as https from 'https';
import { IncomingMessage } from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ProxmoxClient {
  // Remove YAML frontmatter from note content
  private stripFrontMatter(content: string): string {
    return content.replace(/^---\n[\s\S]*?\n---\n?/, '').trimStart();
  }
  // Normalize note content for reliable comparison
  private normalizeNoteContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .split('\n')
      .map(line => line.trimEnd()) // Remove trailing spaces
      .join('\n')
      .replace(/\n+$/g, '') // Remove extra blank lines at end
      .trim();
  }
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

  // Fetch the Proxmox 'notes' (description) for a given VM
  async getProxmoxVMNotes(node: string, vmid: string): Promise<string> {
    const url = `${this.baseUrl}/api2/json/nodes/${node}/qemu/${vmid}/config`;
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
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);
              resolve(parsedData.data?.description || '');
            } catch (error) {
              resolve(''); // If parsing fails, just return empty string
            }
          } else {
            resolve(''); // If request fails, just return empty string
          }
        });
      });
      req.on('error', () => resolve(''));
      req.end();
    });
  }

  async createNotesForVMs(vaultRoot: string): Promise<void> {
    console.log('Starting createNotesForVMs...');
    try {
      const vms = await this.getVMs();
      console.log(`Found ${vms.length} VMs.`);
      const vmsFolder = path.join(vaultRoot, 'VMs');
      await fs.mkdir(vmsFolder, { recursive: true });
      for (const vm of vms) {
        if (vm.type !== 'qemu') continue; // Only process VMs
        console.log(`Creating note for VMID: ${vm.vmid}, Name: ${vm.name || ''}`);
        let proxmoxNote = '';
        if (vm.node && vm.vmid) {
          proxmoxNote = await this.getProxmoxVMNotes(vm.node, vm.vmid);
        }

        // Handle YAML front matter
        let frontMatter = `---\nProxmox ID: ${vm.vmid}\n---`;
        let content = proxmoxNote;
        const frontMatterRegex = /^---\n([\s\S]*?)\n---\n?/;
        const match = proxmoxNote.match(frontMatterRegex);
        if (match) {
          // Existing front matter: update or add Proxmox ID at the end
          let fm = match[1]
            .split(/\r?\n/)
            .filter(line => !/^Proxmox ID:/m.test(line)) // Remove any existing Proxmox ID
            .join('\n');
          if (fm.trim().length > 0) {
            fm += `\nProxmox ID: ${vm.vmid}`;
          } else {
            fm = `Proxmox ID: ${vm.vmid}`;
          }
          frontMatter = `---\n${fm}\n---`;
          content = proxmoxNote.replace(frontMatterRegex, '').trimStart();
        }
        const noteContent = `${frontMatter}\n\n${content}`.trim();
        const fileName = `VM ${vm.vmid} -- ${(vm.name || '').replace(/[^a-zA-Z0-9-_]/g, '_')}.md`;
        const filePath = path.join(vmsFolder, fileName);
        let shouldWrite = true;
        try {
          const existingContent = await fs.readFile(filePath, 'utf8');
          // Remove frontmatter from both existing and new content before comparing
          const existingBody = this.stripFrontMatter(existingContent);
          const newBody = this.stripFrontMatter(noteContent);
          if (this.normalizeNoteContent(existingBody) === this.normalizeNoteContent(newBody)) {
            shouldWrite = false;
            console.log(`No changes for note: ${filePath}`);
          }
        } catch (err) {
          // File does not exist, so we should write it
          shouldWrite = true;
        }
        if (shouldWrite) {
          await fs.writeFile(filePath, noteContent, 'utf8');
          console.log(`Created/Updated note: ${filePath}`);
        }
      }
      console.log('All VM notes created.');
    } catch (err) {
      console.error('Error creating VM notes:', err);
    }
  }

  async createNotesForLXCs(vaultRoot: string): Promise<void> {
    console.log('Starting createNotesForLXCs...');
    try {
      const lxcs = await this.getVMs();
      const lxcFolder = path.join(vaultRoot, 'LXCs');
      await fs.mkdir(lxcFolder, { recursive: true });
      for (const lxc of lxcs) {
        if (lxc.type !== 'lxc') continue; // Only process LXCs
        console.log(`Creating note for LXC ID: ${lxc.vmid}, Name: ${lxc.name || ''}`);
        let proxmoxNote = '';
        if (lxc.node && lxc.vmid) {
          proxmoxNote = await this.getProxmoxLXCNotes(lxc.node, lxc.vmid);
        }
        // Handle YAML front matter
        let frontMatter = `---\nProxmox ID: ${lxc.vmid}\n---`;
        let content = proxmoxNote;
        const frontMatterRegex = /^---\n([\s\S]*?)\n---\n?/;
        const match = proxmoxNote.match(frontMatterRegex);
        if (match) {
          let fm = match[1]
            .split(/\r?\n/)
            .filter(line => !/^Proxmox ID:/m.test(line))
            .join('\n');
          if (fm.trim().length > 0) {
            fm += `\nProxmox ID: ${lxc.vmid}`;
          } else {
            fm = `Proxmox ID: ${lxc.vmid}`;
          }
          frontMatter = `---\n${fm}\n---`;
          content = proxmoxNote.replace(frontMatterRegex, '').trimStart();
        }
        const noteContent = `${frontMatter}\n\n${content}`.trim();
        const fileName = `LXC ${lxc.vmid} -- ${(lxc.name || '').replace(/[^a-zA-Z0-9-_]/g, '_')}.md`;
        const filePath = path.join(lxcFolder, fileName);
        let shouldWrite = true;
        try {
          const existingContent = await fs.readFile(filePath, 'utf8');
          // Remove frontmatter from both existing and new content before comparing
          const existingBody = this.stripFrontMatter(existingContent);
          const newBody = this.stripFrontMatter(noteContent);
          if (this.normalizeNoteContent(existingBody) === this.normalizeNoteContent(newBody)) {
            shouldWrite = false;
            console.log(`No changes for note: ${filePath}`);
          }
        } catch (err) {
          // File does not exist, so we should write it
          shouldWrite = true;
        }
        if (shouldWrite) {
          await fs.writeFile(filePath, noteContent, 'utf8');
          console.log(`Created/Updated note: ${filePath}`);
        }
      }
      console.log('All LXC notes created.');
    } catch (err) {
      console.error('Error creating LXC notes:', err);
    }
  }

  // Fetch the Proxmox 'notes' (description) for a given LXC
  async getProxmoxLXCNotes(node: string, vmid: string): Promise<string> {
    const url = `${this.baseUrl}/api2/json/nodes/${node}/lxc/${vmid}/config`;
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
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);
              resolve(parsedData.data?.description || '');
            } catch (error) {
              resolve('');
            }
          } else {
            resolve('');
          }
        });
      });
      req.on('error', () => resolve(''));
      req.end();
    });
  }
}
