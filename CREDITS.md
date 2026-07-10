# クレジット / Third-party attributions

## KanjiVG

このアプリの手書き採点は、漢字の筆順参照データとして **KanjiVG** を利用しています。

- KanjiVG © Ulrich Apel and contributors
- Website: http://kanjivg.tagaini.net
- License: Creative Commons Attribution-Share Alike 3.0 (CC BY-SA 3.0)
  https://creativecommons.org/licenses/by-sa/3.0/

`web/public/data/strokes-grade-*.json` は KanjiVG の SVG ストロークデータを
正規化・リサンプリングして生成した**派生物**です。KanjiVG のライセンス
(CC BY-SA 3.0) に従い、これらの派生データも同ライセンス（帰属表示・継承）で
配布されます。生成方法は `scripts/build-strokes.mjs` を参照してください。

イラスト（`web/public/illustrations/*.svg`）は本プロジェクトのオリジナルで、
上記ライセンスの対象ではありません。
