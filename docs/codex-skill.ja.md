# Codex Skill

<p><a href="./codex-skill.md">中文</a> · <a href="./codex-skill.en.md">English</a> · <strong>日本語</strong> · <a href="../README.ja.md">README に戻る</a></p>

AI 作業レシートには2つの Codex Skill があります。`ai-work-receipt` は自然言語のレシート依頼を CLI オプションへ変換し、`ai-work-summary` は明示的に選択・確認した後だけ作業サマリーを生成します。

自動保存を有効にしていても、Skill から別の期間のレシートを手動生成できます。手動生成のみのモードでも Skill は使えます。

## インストール

```bash
npx codex-work-receipt@latest --install-skill --lang ja
```

次の場所にインストールされます。

```text
~/.agents/skills/ai-work-receipt/
~/.agents/skills/ai-work-summary/
```

現在のリポジトリは変更しません。現在のセッションで Skill が見つからない場合は Codex を再起動してください。

## 使い方

インストール後、Codex に次のように頼めます。

> 最新の Codex セッションの AI 作業レシートを日本語で作って。

> 今日の AI 作業レシートを diner テーマで作って。

> 票仔、直近3時間のレシートを日本語で出して。

> 今週 Codex がどのくらい作業したか見せて。

Skill はセッション、現在または選択したプロジェクト、日付/時刻のカスタム範囲、直近1～168時間、今日、直近7日間、今週を選び、言語とテーマを加えて CLI を実行します。「直近数時間」は既定で3時間です。

本文を読む作業サマリーでは、先に範囲を選択して確認します。

```bash
npx codex-work-receipt@latest --summary --lang ja
```

通常のレシートはメタデータのみです。作業サマリーは別の JSON に保存され、`.cwr.json`、ミニプログラム同期、通常のレシート履歴には入りません。
