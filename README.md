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

## Merge strategies

By default the plugin deep-merges objects and replaces all other values (arrays, scalars) with the template value. For arrays you may want a different behaviour — for example, _adding_ required plugins to the user's existing list rather than replacing it entirely.

A **merge directive** lets template authors declare the strategy for a specific key:

```json
{
  "plugins": {
    "value": ["required-plugin-a", "required-plugin-b"],
    "__mergeDirective": {
      "strategy": "concat"
    }
  }
}
```

The directive object must have a `__mergeDirective` key. Any object without that key is treated as a normal value and deep-merged as usual.

**Type enforcement:** when source and target values both exist for a key, they must share the same type (e.g. both arrays, both strings). A mismatch throws an error. This applies to both plain merges and directive merges — a directive also requires the target key to already exist with a matching type.

### Available strategies

| Strategy | Behaviour | `unique` supported |
|---|---|---|
| `replace` | `value` replaces the target value entirely (explicit version of the default) | yes |
| `concat` | `[...value, ...targetValue]` — base items first, then user items | yes |

#### `unique` flag

Add `"unique": true` to any directive to remove duplicate entries from the result. Deduplication uses value identity, so it works best with primitive arrays such as plugin ID lists.

```json
{
  "plugins": {
    "value": ["dataview", "templater-obsidian"],
    "__mergeDirective": {
      "strategy": "concat",
      "unique": true
    }
  }
}
```

With `unique: true`, if the user already has `"dataview"` in their list, it will appear only once in the merged result. First-occurrence order is preserved, so `value` items always take precedence over target duplicates.

### Example — enforcing required community plugins

`base-settings/community-plugins.json`:
```json
{
  "value": ["dataview", "templater-obsidian"],
  "__mergeDirective": {
    "strategy": "concat"
  }
}
```

A user whose `community-plugins.json` already contains `["calendar"]` will end up with `["dataview", "templater-obsidian", "calendar"]` after sync.

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

### Community plugin manager

1. Open Obsidian **Settings**
2. Go to **Community plugins** and turn off **Restricted mode** if prompted
3. Click **Browse** and search for **Base Settings**
4. Click **Install**, then **Enable**

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest)
2. Copy them into `.obsidian/plugins/obsidian-base-settings/` in your vault
3. Open Obsidian **Settings → Community plugins** and enable **Base Settings**

## Development

```sh
npm install
npm run dev   # watch mode
npm run build # production build
npm run lint  # lint
```
