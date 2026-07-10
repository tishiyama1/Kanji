# かんじ れんしゅう — 漢字学習アプリ

小学1〜6年生（まずは1〜2年生）が、ひらがなとイラストをヒントに漢字を
「えらぶ」または「てがき（セルフ採点）」で答えて覚える Web アプリ。

- 📖 辞書（意味・例文・自分の正解回数）
- ⭐ 成績（学年ごとの習得率）
- 🔐 かんたん認証（ひらがなの名前＋4桁PIN）で実績を保存

## こうせい

```
Kanji/
├─ docs/仕様書.md   … 仕様（構成・データ設計・画面・段階リリース）
├─ web/            … フロントエンド SPA（React + Vite）※動作確認ずみ
└─ infra/          … AWS CDK（CloudFront+S3 / API Gateway+Lambda / DynamoDB）
```

## アーキテクチャ

```
CloudFront ── default ─→ S3 (private)          … SPA・イラスト・漢字JSON
           └─ /api/*   ─→ API Gateway ─→ Lambda ─→ DynamoDB   … 認証・実績
```

## クイックスタート（ローカル）

```bash
cd web && npm install && npm run dev   # http://localhost:5173
```

localStorage で完結するので、この時点で登録・クイズ・辞書・成績まで一通り動きます。
AWS へのデプロイ手順は `infra/README.md` を参照。

## じっそう じょうきょう

| 項目 | 状態 |
|------|------|
| 仕様書 | ✅ |
| フロント（認証・クイズ・辞書・成績） | ✅ 動作確認ずみ |
| 1年生イラスト（山川木花火犬） | ✅ 6字 |
| 1〜2年生の残りイラスト | ⏳ 同画風で追加予定 |
| AWS バックエンド + IaC | ✅ コード用意（要デプロイ） |
| フロント↔AWS API 接続 | ⏳ `api.js` を fetch 実装に差し替え |
