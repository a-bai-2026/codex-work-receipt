# Codex AI レシート: 作業レシート + 気分レシート

<p align="center">
  <a href="./README.md">中文</a> · <a href="./README.en.md">English</a> · <strong>日本語</strong>
</p>

<p align="center">
  <strong>Codex との協働を、残しておける作業レシートと気分レシートに。</strong><br>
  1コマンド · 自動または手動 · ローカル完結 · WeChat のチャットファイルでインポート
</p>

## 2つのレシート

**作業レシート**は、セッション、ターン、ツール呼び出し、Token、作業時間、モデルを集計します。キャッシュヒット率、1ターンあたりの効率、P50/P90 レイテンシ、作業時間ヒートマップ、モデルとツールの構成も記録します。

**気分レシート**は、ターン数、メッセージ数、中断、応答時間、協働時間など、すでに記録にあるプライバシー保護済みの指標から今回の協働の状態を表現します。プロンプトや応答本文を読んだり、会話内容から意味を推測したりはしません。

どちらのレシートにも、プロンプト、応答本文、ソースコード、プロジェクトパス、ファイル名、ツール引数、ツール出力は保存されません。

## はじめに

Node.js 20 以降と、ローカルにある Codex セッション記録が必要です。クローンやグローバルインストールは不要です。

```bash
npx codex-work-receipt@latest --lang ja
```

初回は次の2つを選びます。

1. 保存モード: 自動保存または手動生成のみ
2. レシートの種類: 作業レシート、気分レシート、または両方

今日の両方のレシートを直接生成するには:

```bash
npx codex-work-receipt@latest --today --receipt-type both --lang ja
```

直近3時間、直近7日間、今週、特定セッション、プロジェクト、日付または時刻で指定した期間にも対応しています。

```bash
npx codex-work-receipt@latest --hours 3 --lang ja
npx codex-work-receipt@latest --range last-7-days --lang ja
npx codex-work-receipt@latest --select-session --lang ja
```

`--hours` と正確な時刻範囲は個人用のローリングサマリーです。AI Work Cooperative の重複排除された集計には参加しません。

## 自動保存

自動保存は Codex の `Stop` Hook を使い、ターンが終わるたびに今日の HTML、ローカル JSON、`.cwr.json` WeChat インポートファイルを更新します。タイマー、アイドル検知、常駐監視、ファイルの自動送信は行いません。

```bash
npx codex-work-receipt@latest --enable-auto --receipt-type both --lang ja
npx codex-work-receipt@latest --disable-auto --lang ja
npx codex-work-receipt@latest --auto-status --lang ja
```

## モバイルへの持ち出し

デスクトップページはプライバシー保護済みの `.cwr.json` を1つ生成します。WeChat のファイル転送または自分のチャットへ送信して、連携ミニプログラムの「チャットファイルからインポート」を使います。データ全体が1つの QR コードに収まる場合だけ、追加でスキャンインポートを表示します。

ミニプログラム本体は別プロダクトであり、現在のモバイルインポート画面は中国語です。日文化の対象はこのリポジトリの CLI、ローカル HTML レシート、Skill、ローカル JSON 表示です。

## Codex に頼む

```bash
npx codex-work-receipt@latest --install-skill --lang ja
```

インストール後は、Codex に次のように頼めます。

> 今日の AI 作業レシートを日本語で作って。

> 票仔、直近3時間のレシートを日本語で出して。

## ドキュメント

- [CLI の使い方](docs/cli.ja.md)
- [Codex Skill](docs/codex-skill.ja.md)
- [データ構造、ファイル、QR プロトコル](docs/data-schema.en.md)
- [ローカルデータとプライバシー](docs/privacy.en.md)

## ライセンス

デスクトップのソースコードは [GNU GPL v3](LICENSE)（`GPL-3.0-only`）です。このプロジェクトは非公式のコミュニティプロジェクトであり、OpenAI とは提携していません。
