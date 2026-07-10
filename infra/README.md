# インフラ (infra) — AWS CDK

CloudFront + S3（静的SPA）と、API Gateway(HTTP API) + Lambda + DynamoDB（動的データ）を
1つの CDK スタックで構築します。

## こうせい

```
CloudFront ── default ─→ S3 (private, OAC)        … SPA・イラスト・漢字JSON
           └─ /api/*   ─→ API Gateway ─→ Lambda ─→ DynamoDB
```

- **S3**: 非公開バケット。CloudFront の OAC 経由のみアクセス可。
- **CloudFront**: `defaultRootObject=index.html`、403/404 を `index.html` に返して SPA ルーティング対応。
- **Lambda** (`lambda/handler.mjs`): `/api/signup|login|me|progress|answer`。
  依存パッケージ無し（Node20 ランタイム同梱の AWS SDK v3 と組み込み crypto のみ）。
- **DynamoDB**: シングルテーブル（`PK`/`SK`）。
  - `USER#<id> / PROFILE` … name, grade, pinHash(scrypt), salt
  - `USER#<id> / KANJI#<字>` … attempts, corrects, lastStudiedAt
  - `LOGIN#<なまえ> / PROFILE` … userId（なまえ→ユーザー解決・重複名防止）

## デプロイ

```bash
# 1) フロントをビルド（S3 に配布される dist を作る）
cd ../web && npm ci && npm run build

# 2) インフラをデプロイ
cd ../infra && npm ci
export JWT_SECRET="長いランダム文字列"   # 本番は Secrets Manager 推奨
npx cdk bootstrap        # 初回のみ
npx cdk deploy
```

デプロイ後、出力 `SiteUrl` が公開URL。`ApiEndpoint` は API Gateway の直URL（通常は
CloudFront 経由の `/api/*` を使うので直接使わない）。

## フロントの接続きりかえ

現状 `web/src/api.js` は localStorage 実装。AWS 版に切り替えるには、同ファイルの各関数を
`fetch('/api/...')` に置き換える（CloudFront 同一ドメインなので CORS 不要）。関数シグネチャは
そのまま使えるように設計してあります。

## セキュリティ メモ

- PIN は Lambda 側で scrypt + ソルトでハッシュ化。平文・クライアントハッシュは保存しない。
- 子供向けの簡易認証のため、総当たり対策（試行回数制限）は最小限。必要なら WAF / レート制限を追加。
- `JWT_SECRET` は必ず本番用のランダム値を Secrets Manager などから注入すること。
