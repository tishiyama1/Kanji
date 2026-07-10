# かんじ れんしゅう — フロントエンド (web)

小学1〜2年生むけ 漢字学習 SPA（React + Vite）。

## つかいかた（かいはつ）

```bash
cd web
npm install
npm run dev      # かいはつサーバー（http://localhost:5173）
npm run build    # dist/ に せいさんビルド
npm run preview  # ビルドの かくにん
```

## こうせい

```
web/
├─ public/
│  ├─ data/grade-{1,2}.json   … 漢字マスタ（読み・意味・例文・画数）
│  └─ illustrations/*.svg     … 漢字イラスト（絵に文字は入れない）
└─ src/
   ├─ api.js                  … バックエンドの seam（今は localStorage。AWS API に差し替え可能）
   ├─ data.js                 … マスタ JSON の読み込み
   ├─ components/HandwritingCanvas.jsx
   └─ screens/                … Login / Home / Quiz / Dictionary / Progress
```

## いまの じっそう じょうきょう

- ✅ 認証（なまえ＋4桁PIN。今は localStorage、`api.js` を AWS API に差し替え予定）
- ✅ えらぶモード（4択）／てがきモード（セルフ採点）
- ✅ 辞書（意味・例文・自分の正解回数）
- ✅ 成績（学年別 習得率）
- ✅ 1年生イラスト 6字（山川木花火犬）
- ⏳ 1〜2年生の残りイラスト（同じ画風で追加予定）
- ⏳ AWS バックエンド（`../infra` 参照）

## デプロイ（そうてい）

`npm run build` の `dist/` を S3 に配置し、CloudFront で配信。
`/api/*` は API Gateway にルーティング（`../infra` 参照）。
