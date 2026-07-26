# CLI ガイド

<p><a href="./cli.md">中文</a> · <a href="./cli.en.md">English</a> · <strong>日本語</strong> · <a href="../README.ja.md">README に戻る</a></p>

## 必要なもの

- Node.js 20 以降
- `~/.codex/sessions/` にあるローカル Codex セッション記録

## 対話モード

```bash
npx codex-work-receipt@latest --lang ja
```

初回は保存モードと出力するレシートの種類を選びます。手動生成のみを選んだ場合は、今日、直近3時間、直近7日間、今週、カスタム期間、最近のセッション、最近のプロジェクトから範囲を選べます。

## レシートの種類

```bash
npx codex-work-receipt@latest --today --receipt-type work --lang ja
npx codex-work-receipt@latest --today --receipt-type emotion --lang ja
npx codex-work-receipt@latest --today --receipt-type both --lang ja
```

`work` は作業レシート、`emotion` は気分レシート、`both` は両方です。既定値は `both` です。

## 保存モード

```bash
npx codex-work-receipt@latest --setup --lang ja
npx codex-work-receipt@latest --enable-auto --receipt-type both --lang ja
npx codex-work-receipt@latest --disable-auto --lang ja
npx codex-work-receipt@latest --auto-status --lang ja
```

自動保存は Codex のユーザーレベル `Stop` Hook を利用します。ターンが終わるたびに短時間のローカル生成処理を起動し、今日のレシートだけを更新します。タイマー、アイドル検知、常駐監視は使用しません。

## 期間の指定

```bash
npx codex-work-receipt@latest --latest --lang ja
npx codex-work-receipt@latest --today --lang ja
npx codex-work-receipt@latest --hours 3 --lang ja
npx codex-work-receipt@latest --range last-7-days --lang ja
npx codex-work-receipt@latest --range this-week --lang ja
npx codex-work-receipt@latest --custom-range --lang ja
```

日付のみの終了日は含まれます。正確な時刻範囲は半開区間 `[start, end)` です。

```bash
npx codex-work-receipt@latest --from 2026-07-01 --to 2026-07-15 --lang ja
npx codex-work-receipt@latest --from 2026-07-23T09:00 --to 2026-07-23T18:30 --lang ja
npx codex-work-receipt@latest --select-session --lang ja
npx codex-work-receipt@latest --select-project --lang ja
```

`--hours` と正確な時刻範囲は個人用の cwr1 サマリーです。今日、今週、直近7日間、特定セッション、日付単位のカスタム範囲は cwr2 の正規記録を生成できます。

## 作業サマリー

作業サマリーは通常のメタデータ専用レシートとは別機能です。選んだセッションの本文を読む前に、対象範囲の表示と明示的な確認を行います。元の本文を保存せず、別の JSON を出力します。

```bash
npx codex-work-receipt@latest --install-skill --lang ja
npx codex-work-receipt@latest --summary --lang ja
npx codex-work-receipt@latest --summary --select-session --lang ja
npx codex-work-receipt@latest --summary --project ./my-project --lang ja
```

非対話実行では `--confirm-summary` が必要です。

## 言語とテーマ

```bash
npx codex-work-receipt@latest --latest --lang zh-CN
npx codex-work-receipt@latest --latest --lang en
npx codex-work-receipt@latest --latest --lang ja --theme diner
```

利用可能なテーマは `classic`、`diner`、`payroll` です。レシートを生成したあとでもページ上でテーマを切り替えられます。

## 主なオプション

| オプション | 説明 |
| --- | --- |
| `--lang <name>` | `zh-CN`（既定値）、`en`、`ja` |
| `--timezone <name>` | `Asia/Shanghai` などの IANA タイムゾーン |
| `--theme <name>` | `classic`、`diner`、`payroll` |
| `--output <file>` | HTML 出力先 |
| `--data-dir <directory>` | ローカル構造データの保存先 |
| `--no-open` | 生成後にブラウザーを開かない |
| `--help [topic]` | カテゴリ別ヘルプを表示 |

```bash
npx codex-work-receipt@latest --help --lang ja
npx codex-work-receipt@latest --help receipt --lang ja
npx codex-work-receipt@latest --help all --lang ja
```

## プライバシー

レシートはローカルで集計・生成され、プロンプト、応答本文、コード、ローカルパス、ファイル名、ツール引数、ツール出力を保存しません。`.cwr.json` を WeChat などに送るのは、利用者が明示的に行う操作です。
