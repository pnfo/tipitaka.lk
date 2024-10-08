import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3';
import { bjtBooksInfo } from '../../tipitaka.lk/src/scanned-pages.mjs';

const db = new Database('../server-data/text.db', { fileMustExist: true });
db.pragma('journal_mode = WAL');

const headingByBook = db.prepare('SELECT * FROM text WHERE language = 0 AND type = 1 AND book_id = ?')

const getKey = (entry) => entry.parent ? [entry.parent, entry.suffix].join('-') : entry.suffix

const headingAtEndKeys = ['kn-vv', 'kn-pv', 'kn-thag', 'kn-thig', 
    'kn-jat$', 'kn-jat-(5|11|22)', 'ap-dhs', 'ap-vbh', 'ap-yam-(6|7|8|10)', 'vp-pv-(1|2)-'] 
const tree = {
    'vp': { text: 'විනයපිටක', level: 7, book_id: 1, parent: '', suffix: 'vp' }, // default page/seq of 1/0 is good enough
    'sp': { text: 'සුත්තපිටක', level: 7, book_id: 10, parent: '', suffix: 'sp' },
    'ap': { text: 'අභිධම්මපිටක', level: 7, book_id: 45, parent: '', suffix: 'ap' },

    'dn': { text: 'දීඝනිකාය', level: 6, book_id: 10, parent: '', suffix: 'dn' },
    'mn': { text: 'මජ්ඣිමනිකාය', level: 6, book_id: 13, parent: '', suffix: 'mn' },
    'sn': { text: 'සංයුත්තනිකායො', level: 6, book_id: 16, parent: '', suffix: 'sn' },
    'an': { text: 'අඞ්ගුත්තරනිකායො', level: 6, book_id: 22, parent: '', suffix: 'an' },
    'kn': { text: 'ඛුද්දකනිකායො', level: 6, book_id: 28, parent: '', suffix: 'kn' },
}

Object.entries(bjtBooksInfo).forEach(([bookId, info]) => {
    if (bookId > 12) return
    const parents = [tree[info.parentKey]], // pull in parent from the tree
        topSuffixs = info.topSuffixes.split(',').reverse()
    const headings = headingByBook.all(bookId), 
        topLevel = Math.max(...headings.map(h => h.level))

    console.assert(parents[0], `book ${bookId}, parentKey: ${info.parentKey} was not found on the tree`)
    console.assert(topLevel == headings[0].level, `highest level in book ${bookId}, ${topLevel} different from first heading level`)
    console.assert(topSuffixs.length <= headings.filter(h => h.level == topLevel).length, `${bookId}, top suffixes must match that in bookinfo`)

    console.log(`processing book ${bookId} with topLevel: ${topLevel}, and ${headings.length} headings`)

    let prevRow
    headings.forEach(row => {
        const lastParent = parents.slice(-1)[0]
        const newEntry = {...row}
        if (row.level == topLevel && topSuffixs.length) {
            newEntry.parent = getKey(lastParent)
            newEntry.suffix = topSuffixs.pop()
        } else if (lastParent.level > row.level) { // child
            newEntry.parent = getKey(lastParent)
            newEntry.suffix = row.key_offset || 1
        } else { // lastParent.level <= row.level
            let sibling
            while (parents.slice(-1)[0].level <= row.level) { sibling = parents.pop() }
            newEntry.parent = getKey(parents.slice(-1)[0])
            newEntry.suffix = row.key_offset || (+sibling.suffix + 1)
        }
        parents.push(newEntry)

        const newKey = getKey(newEntry)
        if (headingAtEndKeys.some(k => newKey.search(k) != -1) && newEntry.level == 1 && prevRow) {
            newEntry.page = prevRow.page // set newEntry's location to prevRow's location + 1
            newEntry.seq = prevRow.seq + 1 // doesn't matter even if at a page boundary
            newEntry.heading_end = 1
        }
        prevRow = row
        tree[newKey] = newEntry
    
        //console.log(`level: ${newEntry.level}, key: ${getKey(newEntry)}, text: ${newEntry.text}`)
    })
})


const cleanText = (text) => {
    text = text.trim()
    text = text.replace(/\{.*?\}/g, '') // remove footnotes
    text = text.replace(/[\[\]\(\)]/g, '') // remove [] ()
    text = text.replace(/\$\$|\*\*|__/g, '') // remove $$ or ** or __
    return text.replace(/\.$/, '').trim() // remove ending .
}
const treeColumns = {
    key: 'TEXT NOT NULL PRIMARY KEY',
    level: 'INTEGER NOT NULL',
    text: 'TEXT NOT NULL',
    parent: 'TEXT DEFAULT ""',
    book_id: 'INTEGER NOT NULL',
    page: 'INTEGER DEFAULT 1',
    seq: 'INTEGER DEFAULT 0',
    heading_end: 'INTEGER DEFAULT 0',
}
db.exec(`DROP TABLE IF EXISTS tree;
    CREATE TABLE IF NOT EXISTS tree (
    ${Object.entries(treeColumns).map(([name, desc]) => name + ' ' + desc).join(',\n')},
    CHECK(book_id >= 1 AND book_id <= 57 AND level >= 1)
);`)
const insertTree = db.prepare(`INSERT INTO tree VALUES (${Object.keys(treeColumns).map(c => '@'+c).join(', ')})`) //(${Object.keys(treeColumns).join(', ')})
Object.entries(tree).forEach(([key, info]) => insertTree.run({key, page: 1, seq: 0, heading_end: 0, ...info, text: cleanText(info.text)}))
db.close()