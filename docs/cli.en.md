# CLI guide

<p><a href="./cli.md">中文</a> · <strong>English</strong> · <a href="../README.en.md">Back to README</a></p>

## Requirements

- Node.js 20 or later
- Local Codex session records under `~/.codex/sessions/`

No clone or global installation is required.

## Interactive range selector

Run:

```bash
npx codex-work-receipt@latest --lang en
```

Choose all activity today, the last 7 calendar days, this week, or a specific recent session. Session choices include their time range, turns, tool calls, and model for identification.

## Non-interactive ranges

Summarize the latest active session and open the receipt:

```bash
npx codex-work-receipt@latest --latest --lang en
```

Summarize all Codex activity from today in your local timezone:

```bash
npx codex-work-receipt@latest --today --lang en
```

Last 7 calendar days, including today:

```bash
npx codex-work-receipt@latest --range last-7-days --lang en
```

Monday through now:

```bash
npx codex-work-receipt@latest --range this-week --lang en
```

## Language and themes

Generate a Chinese receipt:

```bash
npx codex-work-receipt@latest --latest --lang zh-CN
```

Choose the initial theme:

```bash
npx codex-work-receipt@latest --latest --lang en --theme diner
```

Available themes:

- `classic`: classic white receipt
- `diner`: vintage pink diner receipt
- `payroll`: dark-green night payroll receipt

Themes can still be switched in the generated page without changing the metrics.

## Output

Default output:

```text
./codex-work-receipt-output/
├── codex-receipt-latest.html
└── codex-receipt-latest.json
```

Set a timezone and output path:

```bash
npx codex-work-receipt@latest --today --lang en \
  --timezone Asia/Shanghai \
  --output ./my-receipt.html
```

Generate files without opening a browser:

```bash
npx codex-work-receipt@latest --latest --lang en --no-open
```

## Options

| Option | Description |
| --- | --- |
| `--range <name>` | `latest`, `today`, `last-7-days`, or `this-week` |
| `--latest` | Summarize the latest active Codex session; default mode |
| `--today` | Summarize activity from today in the selected timezone |
| `--session <id>` | Summarize one specific Codex session |
| `--timezone <name>` | Set an IANA timezone such as `Asia/Shanghai` |
| `--lang <name>` | `zh-CN` (default) or `en` |
| `--theme <name>` | `classic`, `diner`, or `payroll` |
| `--output <file>` | Set the HTML output path |
| `--data-dir <directory>` | Set the local structured-history directory |
| `--install-skill` | Install the Codex AI Work Receipt skill |
| `--no-open` | Do not open the generated page |

Run the built-in help at any time:

```bash
npx codex-work-receipt@latest --help
```

## Local history

Each run creates or updates:

- `codex-work-receipt-output/codex-receipt-*.html`: theme-switchable receipt page
- `codex-work-receipt-output/codex-receipt-*.json`: versioned receipt data
- `~/.codex-work-receipt/receipts/*.json`: local snapshots
- `~/.codex-work-receipt/latest.json`: latest receipt
- `~/.codex-work-receipt/history.jsonl`: deduplicated local history

See the [data schema and QR protocol](data-schema.en.md).

## Current limitations

- Codex is the only supported data source; Cursor and WorkBuddy are planned
- Changed-file and line counts are intentionally omitted until they can be measured consistently
- Calendar ranges filter individual events by local date and calculate a Token delta for each session
- Image export is handled by the companion mini program rather than the desktop page
