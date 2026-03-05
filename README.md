# Base Settings

An Obsidian plugin for enforcing shared base settings across multi-user vaults.

Define partial JSON files that get deeply merged into `.obsidian` config files on startup and whenever settings change. Base template values always win on conflict, ensuring shared settings are enforced while still giving each user freedom to add their own customizations.

## Use case

Teams or projects with multiple contributors can commit a folder of base template files to version control. When any user opens the vault, the plugin automatically merges those templates into their local `.obsidian` config — enforcing required plugins, shared hotkeys, or any other settings without overriding everything the user has configured.

## How it works

1. Create a folder inside `.obsidian/` to hold your base templates (e.g. `.obsidian/base-settings/`)
2. Add partial JSON files named to match the `.obsidian` config files you want to manage (e.g. `app.json`, `community-plugins.json`)
3. Set the folder path in plugin settings
4. The plugin deeply merges each template into the matching `.obsidian` file — template values take precedence over user values on any conflicting keys

If a target config file does not exist yet (e.g. a plugin hasn't been installed), the template is skipped and will be applied on the next sync after the file is created by Obsidian.

## Settings

| Setting | Description | Default |
|---|---|---|
| Base templates path | Folder containing template JSON files, relative to `.obsidian/` | _(empty)_ |
| Debounce interval | Milliseconds to wait after a file change before syncing | `500` |

## Sync triggers

A sync runs automatically on:

- **Plugin startup** — enforces settings when the vault opens
- **Template file changes** — re-syncs when any file in the templates folder is created, modified, or deleted
- **`.obsidian/` file changes** — re-enforces settings if a user manually reverts a managed value, or when a new plugin config file appears
- **Settings save** — re-syncs when the base templates path is changed

A **Sync base settings** command is also available in the command palette to trigger a sync manually.

## Installation

Copy `main.js`, `manifest.json`, and `styles.css` into `.obsidian/plugins/obsidian-base-settings/` in your vault, then enable the plugin in Obsidian settings.

## Development

```sh
npm install
npm run dev   # watch mode
npm run build # production build
npm run lint  # lint
```
