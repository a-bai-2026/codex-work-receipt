# Ticket Buddy: A Codex Pet That Creates AI Work Receipts

<p align="center">
  <a href="./README.md">中文</a> · <strong>English</strong>
</p>

<p align="center">
  <strong>Give Codex a pet that creates AI work receipts.</strong><br>
  Ticket Buddy reacts to task status and turns each AI collaboration into a private, local-first work receipt.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/codex-work-receipt"><img alt="npm" src="https://img.shields.io/npm/v/codex-work-receipt?color=42CDA7"></a>
  <img alt="Node.js 20+" src="https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white">
  <img alt="GPL-3.0" src="https://img.shields.io/badge/license-GPL--3.0-17231F">
  <img alt="Local first" src="https://img.shields.io/badge/data-local--first-42CDA7">
</p>

<p align="center">
  <a href="docs/codex-pet.en.md"><img src="docs/images/codex-pet-showcase.png" alt="Ticket Buddy in idle, working, needs-input, ready, and failed states" width="920"></a>
</p>

<p align="center">
  <sub>Ticket Buddy lives in Codex's native Pets feature and changes expression when Codex is idle, working, needs input, finishes, or gets blocked. Select the image for setup and state details.</sub>
</p>

## Ticket Buddy Is More Than a Pet

Ticket Buddy is a custom companion for Codex's native Pets feature. It presents task state and provides companionship; it does not collect extra data, run the CLI, or alter the current task. Install it with the AI Work Receipt skill, then ask Codex to create a receipt directly.

Receipts remain the project's core capability. Codex Work Receipt summarizes turns, tool calls, Tokens, duration, and models. It also reports cache hit rate, per-turn efficiency, P50 / P90 latency, a work-time heatmap, and model/tool structure, then turns the result into playful AI work points, a job title, and a review. Receipts never include prompts, responses, source code, project paths, file names, tool arguments, or tool output.

<p align="center">
  <img src="docs/images/readme-hero.jpg" alt="Three Codex Work Receipt themes" width="920">
</p>

The cwr2 protocol creates stable privacy-safe facts for each session and calendar day, allowing overlapping today, last-seven-days, and this-week receipts to be deduplicated. Every receipt also produces one `.cwr.json` WeChat import file. Scan import appears only when the complete payload fits in one data QR code.

## Quickstart

Requires Node.js 20+ and local Codex session records. No clone is required.

### Install Ticket Buddy in Codex

Install the AI Work Receipt skill and Ticket Buddy Codex pet together:

```bash
npx codex-work-receipt@latest --install-companion --lang en
```

Restart Codex, open `Settings > Pets`, select Refresh, choose “票仔 · AI 小票工” (Ticket Buddy), and use `/pet` to wake it. Then ask:

> Ticket Buddy, create today's receipt.

> Ticket Buddy, create a receipt for the last three hours.

To install only the skill:

```bash
npx codex-work-receipt@latest --install-skill --lang en
```

Then ask Codex:

> Create an AI work receipt for my latest Codex session.

Codex will choose the range and theme, run the CLI, and open the receipt. See the [Codex Skill guide](docs/codex-skill.en.md).

### Create a Receipt Directly

The first interactive run asks whether to save automatically or use manual-only mode, then whether to include the work receipt, mood receipt, or both. Automatic saving with both receipts is recommended. Manual mode can generate by time range, a selected session, or a selected project:

```bash
npx codex-work-receipt@latest --lang en
```

Summarize all Codex activity from today:

```bash
npx codex-work-receipt@latest --today --lang en
```

Choose the receipt content explicitly:

```bash
npx codex-work-receipt@latest --today --receipt-type work --lang en
npx codex-work-receipt@latest --today --receipt-type emotion --lang en
npx codex-work-receipt@latest --today --receipt-type both --lang en
```

Summarize the last 3 hours:

```bash
npx codex-work-receipt@latest --hours 3 --lang en
```

“Last N hours” is a rolling summary for private history only. It does not participate in AI Work Cooperative deduplicated accounting. Use today, this week, the last seven days, a specific session, or custom whole calendar dates when you want accountable canonical facts.

Interactively choose a session, project, or custom range:

```bash
npx codex-work-receipt@latest --select-session --lang en
npx codex-work-receipt@latest --select-project --lang en
npx codex-work-receipt@latest --custom-range --lang en
```

Advanced use can pass `--project <directory>`, `--from <start>`, and `--to <end>` directly. Whole calendar-date ranges produce cwr2 canonical facts; exact date-time ranges are private cwr1 summaries.

HTML, structured data, and the WeChat import file are written to `./codex-work-receipt-output/` by default. The page can download its `.cwr.json` file and export either receipt as a shareable image. A missing receipt type keeps its top tab and shows copyable regeneration commands instead of a blank panel. “More CLI features” provides 22 commands grouped by receipt type, range, selection, automation, Ticket Buddy, and help. See the [CLI guide](docs/cli.en.md).

## Automatic saving or manual only

Automatic saving uses the Codex `Stop` hook. Whenever a Codex turn stops, it quietly refreshes the same daily HTML, full JSON, and `.cwr.json` WeChat import file on this computer. It does not open a browser, upload files, or run a persistent watcher. The automatic path is file-first and does not generate a data QR.

Choose the mode again:

```bash
npx codex-work-receipt@latest --setup --lang en
```

Or enable, disable, and inspect automatic saving directly:

```bash
npx codex-work-receipt@latest --enable-auto --receipt-type both --lang en
npx codex-work-receipt@latest --disable-auto --lang en
npx codex-work-receipt@latest --auto-status --lang en
```

Use categorized help when you do not remember a command:

```bash
npx codex-work-receipt@latest --help --lang en
npx codex-work-receipt@latest --help receipt --lang en
npx codex-work-receipt@latest --help auto --lang en
npx codex-work-receipt@latest --help all --lang en
```

Automatic receipts live under `~/.codex-work-receipt/auto/YYYY-MM-DD/`. Switching to manual-only mode removes only the AI Work Receipt hook; it keeps existing receipts and unrelated Codex hooks. Restart Codex after installing the hook. If Codex asks you to review it, use `/hooks` to inspect and trust it. See the official [Codex hooks documentation](https://learn.chatgpt.com/docs/hooks).

## Desktop to mobile

The desktop page generates one privacy-safe `.cwr.json` file. Send it to WeChat File Transfer, then choose “Import from chat file” in the companion mini program. A single data QR remains available only for receipts that fit completely in one code. See [mobile import](docs/mobile-import.en.md).

## Docs

- [CLI usage and options](docs/cli.en.md)
- [Codex Skill](docs/codex-skill.en.md)
- [Ticket Buddy Codex pet](docs/codex-pet.en.md)
- [Mobile file and single-QR import](docs/mobile-import.en.md)
- [Data schema, file, and QR protocol](docs/data-schema.en.md)
- [Local data and privacy](docs/privacy.en.md)
- [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md)

## Sponsor

<p align="center">
  <a href="https://modelflare.dev/sign-up?partner=OB9YXNSEEGOL"><img src="docs/images/sponsors/modelflare-logo.png" alt="ModelFlare Logo" width="56"></a><br>
  <a href="https://modelflare.dev/sign-up?partner=OB9YXNSEEGOL"><strong>ModelFlare</strong></a> · <a href="https://modelflare.dev/sign-up?partner=OB9YXNSEEGOL">modelflare.dev</a><br>
  <sub>Affordable and reliable access to leading AI model APIs, helping independent developers validate ideas faster and turn them into real products.</sub>
</p>

## License

The desktop source is licensed under [GNU GPL v3](LICENSE) (`GPL-3.0-only`). This is an unofficial community project and is not affiliated with OpenAI.

---

<p align="center">
  <strong>If the receipt made you smile, consider leaving a Star.</strong>
</p>
