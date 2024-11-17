import Database from 'better-sqlite3';
import { bjtBooksInfo } from '../../tipitaka.lk/src/scanned-pages.mjs';
import { rootNodes, typeToInt } from '../src/utils.js'
import { convert, Script } from '../src/pali-converter/index.js';

const db = new Database('../server-data/text.db', { fileMustExist: true });
//db.pragma('journal_mode = WAL');

const headingByBook = db.prepare('SELECT * FROM pali WHERE type = 1 AND book_id = ?')

const getKey = (entry) => entry.key || (entry.parent + '-' + entry.suffix)
const addParent = (child, parent) => {
    child.parent = getKey(parent)
    parent.leaf = 0
}
const cleanText = (text) => {
    text = text.trim()
    text = text.replace(/\{.*?\}/g, '') // remove footnotes
    text = text.replace(/[\[\]\(\)]/g, '') // remove [] ()
    text = text.replace(/\$\$|\*\*|__/g, '') // remove $$ or ** or __
    return text.replace(/\.$/, '').trim() // remove ending .
}

const headingAtEndKeys = ['kn-vv', 'kn-pv', 'kn-thag', 'kn-thig', 
    'kn-jat$', 'kn-jat-(5|11|22)', 'ap-dhs', 'ap-vbh', 'ap-yam-(6|7|8|10)', 'vp-pv-(1|2)-'] 
const tree = rootNodes

Object.entries(bjtBooksInfo).forEach(([bookId, info]) => {
    //if (bookId > 54) return
    const parents = info.parentKey.split(',').map(k => tree[k]), // pull in parents from the tree
        topSuffixes = info.topSuffixes.split(',').reverse() // reverse because using pop() which would get last item first
    const headings = headingByBook.all(bookId), 
        topLevel = Math.max(...headings.map(h => h.level))

    console.assert(parents[0], `book ${bookId}, parentKey: ${info.parentKey} was not found on the tree`);
    topLevel != headings[0].level && console.warn(`highest level in book ${bookId}, ${topLevel} different from first heading level`); //allowed in ap-pat
    console.assert(topSuffixes.length <= headings.filter(h => h.level == topLevel).length, `${bookId}, top suffixes must match that in bookinfo`)

    console.log(`processing book ${bookId} with topLevel: ${topLevel}, and ${headings.length} headings`)

    let prevKey = null
    headings.forEach((row, hi) => {
        const lastParent = parents.slice(-1)[0]
        const newEntry = {...row, text: cleanText(row.text), leaf: 1, prevKey, translations: bookId <= 54 ? 'sin_bjt' : '', } // by default a leaf
        if ((row.level == topLevel || hi == 0) && topSuffixes.length) { // toplevel or first heading - use the topsuffixes
            let sibling
            while (parents.slice(-1)[0].level <= row.level) { sibling = parents.pop() }
            addParent(newEntry, parents.slice(-1)[0])
            newEntry.suffix = topSuffixes.pop()
        } else if (lastParent.level > row.level) { // child
            addParent(newEntry, lastParent)
            newEntry.suffix = row.key_offset ?? 1 // don't use || since we want to retain 0 for key-offset
        } else { // lastParent.level <= row.level
            let sibling
            while (parents.slice(-1)[0].level <= row.level) { sibling = parents.pop() }
            addParent(newEntry, parents.slice(-1)[0])
            newEntry.suffix = row.key_offset ?? (+sibling.suffix + 1)
        }
        parents.push(newEntry)

        newEntry.key = getKey(newEntry)
        if (headingAtEndKeys.some(k => newEntry.key.search(k) != -1) && newEntry.level == 1 && prevKey) {
            newEntry.heading_end = 1
        }

        console.assert(!tree[newEntry.key], `key ${newEntry.key} already exists in the tree. duplicate key`)
        tree[newEntry.key] = newEntry
        if (prevKey) tree[prevKey].nextKey = newEntry.key
        prevKey = newEntry.key
        //console.log(`level: ${newEntry.level}, key: ${getKey(newEntry)}, text: ${newEntry.text}`)
    })
});

['eng_thani'].forEach(transTable => {
    const rows = db.prepare(`SELECT book_id, page, seq FROM ${transTable} WHERE type = '${typeToInt['heading']}' AND text != '';`).all()
    const entries = Object.values(tree)
    rows.forEach(row => {
        const entry = entries.find(({book_id, page, seq}) => book_id === row.book_id && page === row.page && seq === row.seq)
        //console.assert(entry, `could not find tree entry for trans heading ${JSON.stringify(row)}`)
        if (entry) entry.translations += (entry.translations ? ',' : '') + transTable
    });
})

Object.values(tree).forEach(entry => {
    const { prevKey, nextKey, page, seq, heading_end } = entry
    if (heading_end) {
        entry.page = tree[prevKey].end_page
        entry.seq = tree[prevKey].end_seq + 1 // doesn't matter even if at a page boundary
        entry.end_page = page
        entry.end_seq = seq
    } else if (nextKey) { // note: nextKey's endpage/seq not set yet
        if (tree[nextKey].heading_end) {
            entry.end_page = page // ends at the current heading itself
            entry.end_seq = seq
        } else {
            entry.end_page = tree[nextKey].page // ends at next heading - 1
            entry.end_seq = tree[nextKey].seq - 1
        }
    } //TODO: last key in a book will not have it's end_page set - because there is no nextkey
})

const treeColumns = {
    key: 'TEXT NOT NULL PRIMARY KEY',
    level: 'INTEGER NOT NULL',
    text: 'TEXT NOT NULL',
    parent: 'TEXT DEFAULT ""',
    leaf: 'INTEGER DEFAULT 1', // whether the node is a leaf
    book_id: 'INTEGER NOT NULL',
    page: 'INTEGER NOT NULL',
    seq: 'INTEGER NOT NULL',
    end_page: 'INTEGER DEFAULT NULL',
    end_seq: 'INTEGER DEFAULT NULL',
    heading_end: 'INTEGER DEFAULT 0',
    translations: 'TEXT DEFAULT ""',
}
db.exec(`DROP TABLE IF EXISTS tree;
    CREATE TABLE IF NOT EXISTS tree (
    ${Object.entries(treeColumns).map(([name, desc]) => name + ' ' + desc).join(',\n')},
    CHECK(book_id >= 1 AND book_id <= 57 AND level >= 1)
);`)
const insertTree = db.prepare(`INSERT INTO tree VALUES (${Object.keys(treeColumns).map(c => '@'+c).join(', ')})`)
Object.values(tree).forEach(entry => insertTree.run({end_page: null, end_seq: null, heading_end: 0, ...entry}))
db.close()


// create a separate db/table for converted tree/headings for each of the scripts
// to be used by the go server when generating headings, since go doesn't have text convert capability
const scripts = [ 'sinh', 'deva', 'latn', 'thai', 'mymr', 'khmr', 'laoo', 'beng', 'tibt', 'cyrl', 'guru', 'gujr', 'telu', 'knda', 'mlym', 
    'taml', 'asse', 'lana', 'brah', 'cakm', 'java', 'bali']
const scriptTreeColumns = {
    key: 'TEXT NOT NULL PRIMARY KEY',
    ...Object.fromEntries(scripts.map(s => [s, 'TEXT NOT NULL']))
}
const dbScripts = new Database('../server-data/script-tree.db', { fileMustExist: false });
dbScripts.exec(`DROP TABLE IF EXISTS tree;
    CREATE TABLE IF NOT EXISTS tree (
    ${Object.entries(scriptTreeColumns).map(([name, desc]) => name + ' ' + desc).join(',\n')}
);`)
const insertScripts = dbScripts.prepare(`INSERT INTO tree VALUES (${Object.keys(scriptTreeColumns).map(c => '@'+c).join(', ')})`)
Object.values(tree).forEach(entry => insertScripts.run({ key: entry.key, ...Object.fromEntries(scripts.map(s => [s, convert(entry.text, s, Script.SINH)])) }))
console.log(`wrote scripts-tree.db with ${Object.values(tree).length} rows for ${scripts.length} scripts.`)
dbScripts.close()