# InterviewCraft 新卒版 (Fresh Graduate Edition)

文系大学生向けAI就活対策サービス。自己分析 → 業界・企業研究 → ES作成・添削 → 面接対策の4ステップを一貫サポート。

## セットアップ手順

### 1. プロジェクトをMacに配置

```bash
# デスクトップに配置する場合
cd ~/Desktop
# ダウンロードしたフォルダをここに置く
cd interviewcraft-fresh
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. 環境変数を設定

`.env.local` ファイルをプロジェクトルートに作成:

```bash
touch .env.local
```

以下の内容を記入:

```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx（あなたのAnthropicAPIキー）
STRIPE_SECRET_KEY=sk_live_xxxxx（あなたのStripeシークレットキー）
STRIPE_PRICE_ID=price_xxxxx（StripeのPrice ID）
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. ローカルで動作確認

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

### 5. Vercelにデプロイ

```bash
# Gitリポジトリを初期化
git init
git add .
git commit -m "Initial commit - InterviewCraft Fresh"

# GitHubにリポジトリを作成してpush
git remote add origin https://github.com/あなた/interviewcraft-fresh.git
git push -u origin main
```

Vercelダッシュボードで:
1. 「New Project」→ GitHubリポジトリを選択
2. 環境変数を設定（上記の.env.localの内容）
3. `NEXT_PUBLIC_BASE_URL` はデプロイ後のURLに変更

### 6. 独自ドメイン設定（任意）

Vercelダッシュボード → Settings → Domains で設定

## 環境変数一覧

| 変数名 | 説明 | 取得場所 |
|--------|------|----------|
| `ANTHROPIC_API_KEY` | Claude API Key | https://console.anthropic.com/ |
| `STRIPE_SECRET_KEY` | Stripe Secret Key | https://dashboard.stripe.com/apikeys |
| `STRIPE_PRICE_ID` | Stripe Price ID | Stripeダッシュボード → 商品 |
| `NEXT_PUBLIC_BASE_URL` | サイトのURL | デプロイ後に設定 |

## Stripeの商品登録

Stripeダッシュボードで:
1. 「商品」→「商品を追加」
2. 名前: `InterviewCraft 新卒版 PRO`
3. 料金: 500円（1回限り）
4. 作成後、Price ID（`price_xxxxx`）を環境変数に設定

## 機能一覧

| STEP | 機能 | 無料/有料 |
|------|------|----------|
| STEP 1 | 自己分析（ガイド付き・フリー入力） | ✅ 無料 |
| STEP 2 | 業界マップ・企業分析レポート | 💰 有料 |
| STEP 3 | ES作成・ES添削（5モード） | 💰 有料 |
| STEP 4 | 面接質問生成（一次/二次/最終/集団） | 💰 有料 |
| STEP 4 | 練習モード（タイマー付き） | 💰 有料 |
