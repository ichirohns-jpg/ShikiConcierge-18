# ふじこ投稿 — iPhoneアプリ試作 0.1

志木なるほど お店めぐりDXの記事の写真・文章・リンクを受け取り、SNSへの画像共有と文章のコピーを行う、UIKit製のiPhone/iPadアプリです。iOS 17以上。

## 現在の状態

ソースとXcodeプロジェクトを作成しました。署名済みIPA、TestFlight配布、実機でのFacebook・Instagram・X・LINEの受け取り確認は未完了です。Webサイトの従来の共有機能は変更していません。

## 操作

1. 写真を選択して投稿文とDXの記事URLを入力する。DX連携後は記事から読み込める。
2. 「① 文章とDXリンクをコピー」を押す。
3. 「② 画像をSNSへ共有」を押して、iOSの共有画面から投稿先を選ぶ。
4. SNSの投稿欄に文章を貼り付け、画像とリンクを確認して投稿する。

写真は全体を保って長辺2400px以下に調整する。合成バナーやOGPカードを追加しない。コピー時点の文章を編集した場合はコピーし直す。共有の完了通知をSNSへの投稿成功とは扱わない。Instagram等でURLがリンクとして扱われるかは投稿形式とSNSの仕様による。

## ビルド・導入（開発担当向け）

MacのXcode 16以上で `FujikoShare.xcodeproj` を開く。Simulatorは以下で署名なしビルド可能。

```sh
xcodebuild -project FujikoShare.xcodeproj -scheme FujikoShare -sdk iphonesimulator -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

実機へ入れるには、XcodeのSigning & Capabilitiesで開発チームと固有Bundle IDを設定して端末へRunする。広く配布するにはApple Developer Programによる署名、App Store Connect登録、TestFlightまたはApp Storeの配布手続きが別途必要。端末の利用者にこの開発作業を要求する運用にはしない。App Store提出前にアイコン・サポートURL・プライバシーポリシー・配布メタデータを追加する。

## DXとの接続

`dx-bridge.mjs` の `makeFujikoShareURL` に記事本文・記事HTTPS URL・写真HTTPS URLを渡し、生成したURLを利用者が押すリンクに設定する。

```js
import { makeFujikoShareURL } from './dx-bridge.mjs';
button.href = makeFujikoShareURL({
  text: post.body,
  articleURL: post.publicArticleURL,
  imageURL: post.publicImageURL
});
```

アプリ未インストール時は開けないため、配布後にインストール案内を同じ画面に用意する。現在の公開DXへはこの接続をまだ適用していない。GASの写真がBase64データだけの場合、記事ごとのHTTPS画像公開処理が別途必要。長い本文を安定して渡す本番運用では、記事IDから取得する認証付きAPIへ移行する。独自URL schemeは他アプリも登録できるため、秘密情報・パスワード・トークンは渡さない。Universal Linksとサーバー認証は未実装。

外部からの読み込みは下書きの置き換え確認を表示し、自動投稿・自動コピーしない。ダウンロードはHTTPS画像、25MB以下、タイムアウト30秒。写真の下書きは端末内のApplication Supportへファイル保護付きで保存。本文・URLは端末内UserDefaults。写真の保存に失敗した場合は画面で知らせる。選択写真以外の写真ライブラリへのアクセス権限は求めない。SNS連携トークン、広告、解析SDKなし。

## 実機合格条件

- Facebook個人プロフィールで、写真を選び直さずに画像が入った投稿画面へ進めるか。
- 日本語本文とDXリンクを貼り付けられるか。Facebookがリンクプレビューに置き換えないか。
- 正方形・縦長・横長・文字入り・HEIC写真の向き、文字切れ、画質。
- 共有キャンセル、写真取り込み失敗、ネットワーク失敗、アプリ再起動、下書き消去。
- Instagram・X・LINEそれぞれで、画像と貼り付けた文章がどう表示されるか。

SNSアプリのバージョンで動作が変わり得る。すべてのSNSで同一の受け取り結果を保証しない。通常の添付写真全体に外部DXリンクを埋め込む機能はない。配信・投稿完了は各SNSで確認する。

## ローカル確認

`node --test test-bridge.mjs` はDXからの受け渡しURLの日本語・改行保持と不正URL拒否を確認する。iOSコードのコンパイルと実機テストの代わりにはならない。
