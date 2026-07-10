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

## 手動デプロイ

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

## CI/CD（GitHub Actions）

`.github/workflows/deploy.yml` が **main への push で自動デプロイ**します
（フロントのビルド → `cdk deploy`。dist の S3 配布と CloudFront 無効化はスタックが実施）。
`.github/workflows/ci.yml` は PR でビルド＋`cdk synth` を検証します。

### 一度だけ必要な準備

1. **CDK bootstrap（初回のみ、ローカルで）**
   ```bash
   cd infra && npm ci
   npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
   ```

2. **GitHub OIDC プロバイダを AWS に作成**（未作成の場合）
   - IAM → Identity providers → Add provider
   - Provider URL: `https://token.actions.githubusercontent.com`、Audience: `sts.amazonaws.com`

3. **デプロイ用 IAM ロールを作成**し、信頼ポリシーで当リポジトリを許可:
   ```json
   {
     "Effect": "Allow",
     "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
     "Action": "sts:AssumeRoleWithWebIdentity",
     "Condition": {
       "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
       "StringLike": { "token.actions.githubusercontent.com:sub": "repo:tishiyama1/Kanji:*" }
     }
   }
   ```
   権限は CDK デプロイ相当が必要。手早くやるなら CloudFormation 経由の
   デプロイ権限（S3 / CloudFront / Lambda / DynamoDB / API Gateway / IAM PassRole など）。
   最小権限にするなら CDK の `cdk-readonly`/デプロイ用ロール設計を参照。

4. **GitHub にシークレット/変数を設定**（Settings → Secrets and variables → Actions）
   - Secret `AWS_DEPLOY_ROLE_ARN` … 上で作ったロールの ARN
   - Secret `JWT_SECRET` … 長いランダム文字列
   - Variable `AWS_REGION`（任意）… 既定は `ap-northeast-1`

以降は **main に push すると自動でデプロイ**されます（手動実行は Actions の
"Deploy" → Run workflow）。準備が済むまで deploy ジョブは AWS 認証ステップで失敗します。

## フロントの接続きりかえ

現状 `web/src/api.js` は localStorage 実装。AWS 版に切り替えるには、同ファイルの各関数を
`fetch('/api/...')` に置き換える（CloudFront 同一ドメインなので CORS 不要）。関数シグネチャは
そのまま使えるように設計してあります。

## セキュリティ メモ

- PIN は Lambda 側で scrypt + ソルトでハッシュ化。平文・クライアントハッシュは保存しない。
- 子供向けの簡易認証のため、総当たり対策（試行回数制限）は最小限。必要なら WAF / レート制限を追加。
- `JWT_SECRET` は必ず本番用のランダム値を Secrets Manager などから注入すること。
