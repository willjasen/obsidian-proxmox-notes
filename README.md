# obsidian-proxmox-notes

Integrate Proxmox VM and container notes within [Obsidian](https://obsidian.md).

---

## Features
- Create a one-way sync of notes from Proxmox VMs and containers into notes in Obsidian

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

---

## In Obsidian

Here are two screenshots of the plugin in action.

This is the folder structure of notes, with a custom vault path.

<img width="498" height="328" alt="Screenshot 2025-09-16 at 8 17 37 PM" src="https://github.com/user-attachments/assets/53ca29c9-20cc-4a60-8b8b-3abc0fd442f3" />

Here is a note, in which the note's contents are the same Markdown note for an example VM.
<img width="1760" height="1230" alt="Screenshot 2025-09-16 at 8 17 51 PM" src="https://github.com/user-attachments/assets/1ef96881-e33d-483a-a27d-5f502c72f1c3" />

---

## Troubleshooting
- Make sure your API token has sufficient permissions in Proxmox.
- Check the Obsidian console for error messages if notes are not generated.

## Links
- [Obsidian API Documentation](https://github.com/obsidianmd/obsidian-api)
- [Proxmox API Documentation](https://pve.proxmox.com/pve-docs/api-viewer/index.html)
