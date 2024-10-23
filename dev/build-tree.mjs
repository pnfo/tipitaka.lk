import Database from 'better-sqlite3';
import { bjtBooksInfo } from '../../tipitaka.lk/src/scanned-pages.mjs';
import { rootNodes, typeToInt, queryDb } from '../src/utils.js'

const db = new Database('../server-data/text.db', { fileMustExist: true });
db.pragma('journal_mode = WAL');

const headingByBook = db.prepare('SELECT * FROM pali WHERE type = 1 AND book_id = ?')

const getKey = (entry) => entry.key || (entry.parent + '-' + entry.suffix)
const addParent = (child, parent) => {
    child.parent = getKey(parent)
    parent.leaf = 0
}

const headingAtEndKeys = ['kn-vv', 'kn-pv', 'kn-thag', 'kn-thig', 
    'kn-jat$', 'kn-jat-(5|11|22)', 'ap-dhs', 'ap-vbh', 'ap-yam-(6|7|8|10)', 'vp-pv-(1|2)-'] 
const tree = rootNodes

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
        const newEntry = {...row, leaf: 1, translations: ''} // by default a leaf
        if (row.level == topLevel && topSuffixs.length) {
            addParent(newEntry, lastParent)
            newEntry.suffix = topSuffixs.pop()
        } else if (lastParent.level > row.level) { // child
            addParent(newEntry, lastParent)
            newEntry.suffix = row.key_offset || 1
        } else { // lastParent.level <= row.level
            let sibling
            while (parents.slice(-1)[0].level <= row.level) { sibling = parents.pop() }
            addParent(newEntry, parents.slice(-1)[0])
            newEntry.suffix = row.key_offset || (+sibling.suffix + 1)
        }
        parents.push(newEntry)

        newEntry.key = getKey(newEntry)
        if (headingAtEndKeys.some(k => newEntry.key.search(k) != -1) && newEntry.level == 1 && prevRow) {
            newEntry.headingLocation = {page: newEntry.page, seq: newEntry.seq} // needed for finding translation availablity
            newEntry.page = prevRow.page // set newEntry's location to prevRow's location + 1
            newEntry.seq = prevRow.seq + 1 // doesn't matter even if at a page boundary
            newEntry.heading_end = 1
        }
        prevRow = row
        console.assert(!tree[newEntry.key], `key ${newEntry.key} already exists in the tree. duplicate key`)
        tree[newEntry.key] = newEntry
    
        //console.log(`level: ${newEntry.level}, key: ${getKey(newEntry)}, text: ${newEntry.text}`)
    })
});

['sin_bjt', 'eng_thani'].forEach((transTable, i) => {
    const rows = db.prepare(`SELECT book_id, page, seq, text FROM ${transTable} WHERE type = '${typeToInt['heading']}' AND text != '';`).all()
    const entries = Object.values(tree)
    rows.forEach(row => {
        const entry = entries.find(entry => {
            const {page, seq} = entry.heading_end ? entry.headingLocation : entry
            return entry.book_id === row.book_id && page === row.page && seq === row.seq
        })
        //console.assert(entry, `could not find tree entry for trans heading ${JSON.stringify(row)}`)
        if (entry) entry.translations += (i ? ',' : '') + transTable
    });
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
    leaf: 'INTEGER DEFAULT 1', // whether the node is a leaf
    book_id: 'INTEGER NOT NULL',
    page: 'INTEGER NOT NULL',
    seq: 'INTEGER NOT NULL',
    heading_end: 'INTEGER DEFAULT 0',
    translations: 'TEXT DEFAULT ""',
}
db.exec(`DROP TABLE IF EXISTS tree;
    CREATE TABLE IF NOT EXISTS tree (
    ${Object.entries(treeColumns).map(([name, desc]) => name + ' ' + desc).join(',\n')},
    CHECK(book_id >= 1 AND book_id <= 57 AND level >= 1)
);`)
const insertTree = db.prepare(`INSERT INTO tree VALUES (${Object.keys(treeColumns).map(c => '@'+c).join(', ')})`)
Object.values(tree).forEach(entry => insertTree.run({heading_end: 0, ...entry, text: cleanText(entry.text)}))
db.close()