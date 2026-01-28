import { parseFeed } from 'feedsmith';

const url = 'https://umo.cl/blogs/noticias.atom';

const response = await fetch(url);
const xml = await response.text();

const parsed = await parseFeed(xml);

console.log('=== Feedsmith Structure ===');
console.log('Format:', parsed.format);
console.log('\n=== Feed Object Keys ===');
console.log(Object.keys(parsed.feed));

console.log('\n=== First Item (if exists) ===');
if (parsed.feed.items && parsed.feed.items.length > 0) {
  console.log('Items:', parsed.feed.items.length);
  console.log('First item:', JSON.stringify(parsed.feed.items[0], null, 2));
} else if (parsed.feed.entries && parsed.feed.entries.length > 0) {
  console.log('Entries:', parsed.feed.entries.length);
  console.log('First entry:', JSON.stringify(parsed.feed.entries[0], null, 2));
} else {
  console.log('No items or entries found');
  console.log('Full feed:', JSON.stringify(parsed.feed, null, 2));
}
