import fs from 'fs'
import path from 'path'
import sqlite3 from 'sqlite3'; // Import the sqlite3 module and enable verbose logging
sqlite3.verbose()
import { bjtBooksInfo } from '../src/scanned-pages.mjs';

const openDb = (file, isWrite = true) => {
    const mode = isWrite ? (sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE) : sqlite3.OPEN_READONLY;
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(file, mode, err => err ? reject(err) : resolve(db));
    })
}

const runAsync = async (db, sql, params) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err, row) => err ? reject(err) : resolve(row));
    });
}
async function batchInsert(tableName, columns, valuesList) {
    await runAsync(db, 'BEGIN')
    const columnNames = Object.keys(columns)
    const stmt = await db.prepare(`INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${Array(columnNames.length).fill('?').join(', ')})`);
    for (const values of valuesList) {
         await stmt.run(values); 
    }
    await stmt.finalize();
    await runAsync(db, 'COMMIT')
    console.log(`wrote ${valuesList.length} rows to ${tableName} table`)
}

const populateBooks = () => batchInsert('book', booksColumns, Object.entries(bjtBooksInfo).map(([id, info]) => [id, ...Object.values(info)]))

const typeToInt = {centered: 0, heading: 1, paragraph: 2, gatha: 3, unindented: 4, footnote: 5,}
const textColumns = {
    book_id: 'INTEGER NOT NULL',
    page: 'INTEGER NOT NULL',
    seq: 'INTEGER NOT NULL',
    language: 'INTEGER NOT NULL',
    type: 'INTEGER NOT NULL', // typeToInt conversion
    level: 'INTEGER DEFAULT NULL',
    text: 'TEXT NOT NULL',
    key_offset: 'INTEGER DEFAULT NULL', // adding sparsely populated columns have minimal affect on db size
}
const booksColumns = {
    id: 'INTEGER NOT NULL PRIMARY KEY',
    name: 'TEXT NOT NULL DEFAULT ""',
    max_page: 'INTEGER NOT NULL DEFAULT 0',
    first_page: 'INTEGER NOT NULL DEFAULT 0',
    page_offset: 'INTEGER NOT NULL DEFAULT 0',
    image_prefix: 'TEXT NOT NULL DEFAULT ""',
}
const createTables = [
'DROP TABLE IF EXISTS book;',
`CREATE TABLE IF NOT EXISTS book (
    ${Object.entries(booksColumns).map(([name, desc]) => name + ' ' + desc).join(',\n')},
    CHECK(id >= 1 AND id <= 57)
);`,
'DROP TABLE IF EXISTS text;',
`CREATE TABLE IF NOT EXISTS text (
    ${Object.entries(textColumns).map(([name, desc]) => name + ' ' + desc).join(',\n')},
    PRIMARY KEY(book_id, page, seq, language),
    CHECK(page >= 1 AND seq >= 0 AND level >= 0 AND language >= 0 AND language <= 1)
);`,]

const db = await openDb('../db/text.db') 
for (const statement of createTables) {
    await runAsync(db, statement);
}
await populateBooks()
await populateText()

async function populateText() {
    const dataInputFolder = '../public/static/text'
    const filesFilter = /^dn-|^mn-|^sn-|^an-|^kn-|^ap-|^vp-/
    const inputFiles = fs.readdirSync(dataInputFolder).filter(name => filesFilter.test(name)).sort()
    console.log(`num files selected ${inputFiles.length}`)
    const dedup = {}

    for (const filename of inputFiles) {
        const obj = JSON.parse(fs.readFileSync(path.join(dataInputFolder, filename)))
        const paliOnly = /^ap-pat/.test(filename)//, isAtta = filename.startsWith('atta-')
        const bookInfo = bjtBooksInfo[obj.bookId], valuesList = []
        for (const page of obj.pages) {
            console.assert(paliOnly || page.pali.entries.length == page.sinh.entries.length, `pali and sinh entry counts are different ${filename}:${page.pageNum}`)
            const realPage = page.pageNum + obj.pageOffset + bookInfo.pageNumOffset
            let seq = page.pali.sequenceStart || 0 // mn-1-x has cases where the page is split between two json files - making book/page repeat
            valuesList.push(...page.pali.entries.map(e => [obj.bookId, realPage, seq++, 0, typeToInt[e.type], e.level, e.text, e.keyOffset]))
            valuesList.push(...page.pali.footnotes.map(fn => [obj.bookId, realPage, seq++, 0, typeToInt['footnote'], null, fn.text, null]))
            
            if (paliOnly) continue
            seq = page.sinh.sequenceStart || 0
            valuesList.push(...page.sinh.entries.map(e => [obj.bookId, realPage, seq++, 1, typeToInt[e.type], e.level, e.text, e.keyOffset]))
            valuesList.push(...page.sinh.footnotes.map(fn => [obj.bookId, realPage, seq++, 1, typeToInt['footnote'], null, fn.text, null]))
        }
        // write one file at a time so that the valuesList is not too big
        //console.log(`bookid: ${obj.bookId}, file: ${filename}`)
        await batchInsert('text', textColumns, valuesList)
        // valuesList.forEach(values => {
        //     const key = values.slice(0, 4).join('-')
        //     if (dedup[key]) console.error(`dup found ${key} in ${filename} and ${dedup[key]}`)
        //     dedup[key] = filename
        // })
    }
}

await runAsync(db, 'VACUUM;')
db.close()