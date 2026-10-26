import test from 'node:test';
import assert from 'node:assert/strict';
import { makeFujikoShareURL } from './dx-bridge.mjs';
test('日本語・改行・記号・記事パラメータを壊さずアプリに渡す', () => {
  const text = '本日のおすすめ🍞\n500円 & お得 #志木 + 100%';
  const articleURL = 'https://example.com/article?id=7&from=dx';
  const imageURL = 'https://example.com/写真.jpg';
  const result = new URL(makeFujikoShareURL({ text, articleURL, imageURL }));
  assert.equal(result.protocol, 'fujikoshare:');
  assert.equal(result.host, 'compose');
  assert.equal(result.searchParams.get('text'), text);
  assert.equal(result.searchParams.get('url'), articleURL);
  assert.equal(result.searchParams.get('image'), new URL(imageURL).href);
});
test('非HTTPS・認証情報入り・埋め込み画像URLを受け付けない', () => {
  for (const bad of ['http://example.com/', 'javascript:alert(1)', 'https://user:secret@example.com/', 'data:image/png;base64,123']) {
    assert.throws(() => makeFujikoShareURL({ articleURL: bad }));
    assert.throws(() => makeFujikoShareURL({ articleURL: 'https://example.com/', imageURL: bad }));
  }
});
test('空の文章と画像なしの記事も渡せる／過大な文章は拒否', () => {
  const result = new URL(makeFujikoShareURL({ articleURL: 'https://example.com/' }));
  assert.equal(result.searchParams.get('text'), '');
  assert.equal(result.searchParams.has('image'), false);
  assert.throws(() => makeFujikoShareURL({ text: 'あ'.repeat(20001), articleURL: 'https://example.com/' }));
});
