# Codex Skill

<p><a href="./codex-skill.md">中文</a> · <strong>English</strong> · <a href="../README.en.md">Back to README</a></p>

AI Work Receipt includes a Codex Skill that converts natural-language requests into the appropriate CLI options.

## Install

```bash
npx codex-work-receipt@latest --install-skill --lang en
```

The skill is installed at:

```text
~/.agents/skills/ai-work-receipt/
```

It does not modify the current repository. Restart Codex if the current session does not detect the newly installed skill.

## Use

After installation, ask Codex:

> Create an AI work receipt for my latest Codex session.

> Generate today's AI work receipt with the diner theme.

> Generate an AI work receipt for the last seven days.

> Show how much Codex worked this week.

> Create a Chinese receipt for my latest session.

Codex will choose a specific session, today, the last seven days, or this week, plus the language and theme, then run the CLI and open the generated page.

You can also invoke the skill explicitly with `$ai-work-receipt`.

## Update

Run the installation command again to safely replace an older version:

```bash
npx codex-work-receipt@latest --install-skill --lang en
```
