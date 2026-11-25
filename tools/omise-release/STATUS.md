# 2026-11-25：動画投稿の送信容量を整合（GAS第30版で公開済み）

- 投稿画面の25MiB動画はbase64化すると約3,495万文字になるため、従来のAPI入口24,000,000文字制限で送信できませんでした。
- OwnerApi.gsと配布用LiveCode.gs／LiveCode.txtの入口上限を37,000,000文字に統一しました。動画・写真4枚・表紙・OGP画像・本文を既存上限まで含めたローカル試験は36,804,281文字で通ります。
- 超過時は添付を減らす案内を返します。ownerVersionのmaxRequestCharsで公開後の反映を確認できます。認証・店舗別の所有者権限は変更していません。
- ローカル14件成功。既存のApps Script管理画面で対象の公開デプロイを照合し、2026年11月25日19:37 JSTに第29版から第30版へ更新しました。公開ownerVersionのGETでHTTP200・ok=true・maxRequestChars=37000000を確認済みです。
- 既存GASの編集画面：https://script.google.com/home/projects/1oAikC3YWOCRsK0OsFcBoQlNn3_6yu3eFvMQ7nipZtcO9zrSewjt0mA14/edit 。既存コードを読み戻し、容量判定とownerVersionの2箇所だけを置換して保存・公開しました。公開URL・実行ユーザー・アクセス範囲は維持しています。
- 本番への架空投稿・動画アップロードによる試験は実施していません。

```bash
node --test tools/omise-release/test-owner-payload.mjs tools/omise-release/test-merchant.mjs tools/omise-release/test-owner-api.mjs tools/omise-release/test-remember-login.mjs
```

# 2026-10-28：操作を増やさない修正と30日ログイン

## 反映する内容

- お得情報の入口からは投稿種類を自動選択する（mode=edit&kind=deal）。
- お得情報の終了日は必須。過去の日付・存在しない日付は保存しない。終了した情報は公開一覧・共有から外す。
- 店舗一覧とプロフィールの基本情報は店舗一覧シートを正として読む。固定の紹介内容で保存済みデータを上書きしない。
- 紹介1枠目の画像を差し替えたら、一覧の画像も同じ保存で更新する。
- 一覧へ戻ると、読み込んでいた記事とスクロール位置を復元する。店の検索条件も保持する。
- 失敗時は入力を残す。同じ送信をやり直しても投稿が重複しない。
- 投稿・基本情報・紹介4枠の画面は同じ30日セッションを使う。生の専用コードは保存せず、取り消し可能なトークンだけを保存する。
- 一時的な通信失敗ではログインを消さず、再接続できるようにする。期限切れ・取り消し確認時だけ再ログインする。

## 公開とソース

- 認証済みの店舗投稿・情報変更は即時公開を維持する。
- 公開サイトのソースは omise-demo/。tools/omise-release/site/ の古い見本を上書き配信しない。
- LiveCode.gs と LiveCode.txt は全文が一致する。既存GASプロジェクトに全文を保存し、既存デプロイを新バージョンへ更新する。新しいプロジェクトや新しい公開URLは作らない。
- PostEditor.html / MerchantEditor.html / Scenes.html と Posts.gs / Scenes.gs を編集後、rebuild-live.mjs で全文を再生成する。
- 再生成時は埋め込みエディターの後ろにある紹介4枠の定義も保持する。
- 配信済みのGASはGitHub更新だけでは変わらない。利用者によるGAS保存・既存デプロイ更新後に実画面で確認する。

## 検証

node --test tools/omise-release/test-merchant.mjs tools/omise-release/test-scenes.mjs tools/omise-release/test-remember-login.mjs tools/omise-release/test-simple-ui.mjs

サーバー処理・画面処理のテストで、同一情報の反映、期限、再送時の重複防止、店舗間の分離、3画面でのログイン再利用、通信失敗でのログイン保持、一覧への復帰を確認する。本番GAS更新とiPhoneでの再確認は別の工程。
