# obsidian-proxmox-notes

Integrate Proxmox VM and container notes within [Obsidian](https://obsidian.md).

---

## Features
- Automatically creates or updates notes for each VM and LXC in your Proxmox cluster

## Installation
1. **Clone or download this repository.**
2. **Install dependencies:**
	```sh
	npm install
	```
3. **Build the plugin:**
	```sh
	npm run build
	```
4. **Copy files to your vault:**
	Copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugin folder:
	`YourVault/.obsidian/plugins/proxmox-notes/`
5. **Enable the plugin in Obsidian settings.**

## Configuration
Open the settings tab in Obsidian and configure:
- **Proxmox API Base URL** (e.g., `https://your-proxmox-server:8006/api2/json`)
- **API Token** (create in Proxmox, format: `user@pam!tokenname=yourtoken`)
- **Notes Directory** (optional, defaults to vault root)

## Usage
- On startup, the plugin will generate notes for all VMs and LXCs in the configured directory.
- Use the ribbon icon to open the Proxmox view and see your VMs and containers.
- Notes are updated automatically when the plugin loads.

## Development
This plugin uses TypeScript and the Obsidian API.

- `npm run dev` — Compile in watch mode
- `npm run build` — Type-check and build for production

## Contributing
Pull requests and issues are welcome! Please open an issue for bugs or feature requests.

## License
GPLv3

## Credits
Author: [willjasen](https://github.com/willjasen)

---

## Troubleshooting
- Make sure your API token has sufficient permissions in Proxmox.
- Check the Obsidian console for error messages if notes are not generated.

## Links
- [Obsidian API Documentation](https://github.com/obsidianmd/obsidian-api)
- [Proxmox API Documentation](https://pve.proxmox.com/pve-docs/api-viewer/index.html)
