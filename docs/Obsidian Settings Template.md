---
tags:
  - task
  - obsidian
  - plugin
sources:
related:
status:
contexts:
  - software
priority:
created: 2026-03-05T09:13:29-05:00
modified: 2026-03-05T09:13:29-05:00
---
# Obsidian Settings Template

## Spec

Draft an Obsidian plugin that lets users define partial .json files that get merged into JSON files in their .obsidian folder. This way projects with multi-user setups can define base files for settings and plugins that will be enforced on other users but still gives them flexibility to have custom settings and additional plugins.

### How it Works

In plugin settings, users can customize which folder will contain the base templates. This folder lives inside `.obsidian` (e.g. `.obsidian/base-settings/`). For reference, the value of that setting will be referred to as `$baseTemplates` in this document.

The plugin triggers a sync in the following situations:

1. **On startup** — runs once when the plugin loads
2. **`$baseTemplates` watcher** — re-runs when any file inside `$baseTemplates` is created, modified, or deleted
3. **`.obsidian/` watcher** — re-runs when any `.json` file in `.obsidian/` is created or modified; this enforces base settings if a user manually changes an enforced value, and catches new plugin config files as they appear
4. **On settings save** — re-runs when the user updates plugin settings
5. **Manual command** — a command palette entry to trigger a sync on demand

Both file watchers are **debounced** to avoid redundant syncs during rapid sequential writes. The debounce interval is configurable in plugin settings (default: 500ms).

To prevent a feedback loop, the `.obsidian/` watcher is **unregistered before a sync run and re-registered after** — ensuring the plugin's own writes do not re-trigger a sync.

### Merge Behavior

- The plugin looks for `.json` files in `$baseTemplates` and matches them by filename to `.json` files in `.obsidian/`.
- Keys from the base template are **deeply merged** into the target file, with **base template values always winning** on conflict. This enforces the base settings regardless of what the user has set.
- If the target `.obsidian/*.json` file **does not exist**, the plugin does **nothing** for that template. This avoids creating stale config for plugins that haven't been installed yet. The next sync after the file is created naturally by Obsidian will enforce the template.
- `.obsidian` files with no corresponding base template are left untouched.

### Example

Given `.obsidian/base-settings/app.json`, the keys in that file are deeply merged into `.obsidian/app.json`, with template values overwriting any conflicting user values.

### Features

- Setting to configure the `$baseTemplates` folder path (relative to `.obsidian/`)
- Setting to configure the debounce interval in milliseconds (default: 500ms)
- Sync on startup, file change, settings save, and manual command
- Watchers on both `$baseTemplates` and `.obsidian/`, debounced
- `.obsidian/` watcher paused during sync to prevent feedback loops
- Deep merge with base template values taking precedence
- Skip target files that don't exist yet

## Tasks

### Phase I: Setup the Plugin ✅

- [x] Use the plugin template to create a repo
- [x] Install packages

### Phase II: Core Implementation

- [ ] Rename plugin classes and identifiers from sample names to plugin-specific names
- [ ] Define `baseTemplatesPath` setting (string, path relative to `.obsidian/`, default empty)
- [ ] Define `debounceInterval` setting (number in ms, default 500)
- [ ] Implement deep merge utility: recursively merges source into target, source wins on conflict
- [ ] Implement sync procedure:
  - Read all `.json` files from `$baseTemplates`
  - For each, check if a matching `.json` exists in `.obsidian/`
  - If target exists: deep merge template into it and write back
  - If target does not exist: skip
- [ ] Run sync on plugin startup (after settings load)
- [ ] Register debounced file watcher on `$baseTemplates`; re-run sync on any change
- [ ] Register debounced file watcher on `.obsidian/`; unregister before sync, re-register after
- [ ] Re-run sync when plugin settings are saved
- [ ] Register `Sync base settings` command to trigger sync manually

### Phase III: Polish

- [ ] Update `manifest.json` with correct plugin name, description, and author
- [ ] Update `README.md` to describe the plugin and its configuration
- [ ] Add console logging for sync operations (files merged, files skipped)
