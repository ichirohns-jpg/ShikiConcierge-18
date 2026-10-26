// DXの記事画面から、利用者がボタンを押してアプリを開くための接続部分。
// アプリのインストール確認やSNSへの投稿完了は、この関数では判定しない。
function httpsURL(value, name) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${name}はHTTPSの公開URLを指定してください`);
  return url.href;
}
export function makeFujikoShareURL({ text = '', articleURL, imageURL }) {
  if (typeof text !== 'string' || text.length > 20000) throw new Error('投稿文が長すぎます');
  const link = httpsURL(articleURL, '記事');
  if (link.length > 4096) throw new Error('記事URLが長すぎます');
  const result = new URL('fujikoshare://compose');
  result.searchParams.set('text', text);
  result.searchParams.set('url', link);
  if (imageURL) result.searchParams.set('image', httpsURL(imageURL, '画像'));
  return result.href;
}
