import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3';
import { bjtBooksInfo } from '../../tipitaka.lk/src/scanned-pages.mjs';
import { typeToInt } from '../src/utils.js';

const questionStr = (count) => Array(count).fill('?').join(', ')

const booksColumns = {
    id: 'INTEGER NOT NULL PRIMARY KEY',
    name: 'TEXT NOT NULL DEFAULT ""',
    max_page: 'INTEGER NOT NULL DEFAULT 0',
    first_page: 'INTEGER NOT NULL DEFAULT 0',
    page_offset: 'INTEGER NOT NULL DEFAULT 0',
    image_prefix: 'TEXT NOT NULL DEFAULT ""',
    parent_key: 'TEXT NOT NULL DEFAULT ""',
    top_suffixes: 'TEXT NOT NULL DEFAULT ""',
}
const paliColumns = {
    book_id: 'INTEGER NOT NULL',
    page: 'INTEGER NOT NULL',
    seq: 'INTEGER NOT NULL',
    type: 'INTEGER NOT NULL', // typeToInt conversion
    level: 'INTEGER DEFAULT NULL',
    text: 'TEXT NOT NULL',
    key_offset: 'INTEGER DEFAULT NULL', // adding sparsely populated columns have minimal affect on db size
    no_audio: 'INTEGER DEFAULT NULL',
}
const transColumns = {
    book_id: 'INTEGER NOT NULL',
    page: 'INTEGER NOT NULL',
    seq: 'INTEGER NOT NULL',
    type: 'INTEGER NOT NULL', // typeToInt conversion
    level: 'INTEGER DEFAULT NULL',
    text: 'TEXT NOT NULL',
}
const createBookTable = 
    `DROP TABLE IF EXISTS book;
    CREATE TABLE IF NOT EXISTS book (
        ${Object.entries(booksColumns).map(([name, desc]) => name + ' ' + desc).join(',\n')},
        CHECK(id >= 1 AND id <= 57)
    );`
const createGenericTable = (tableName, columns) => `
    DROP TABLE IF EXISTS ${tableName};
    CREATE TABLE IF NOT EXISTS ${tableName} (
        ${Object.entries(columns).map(([name, desc]) => name + ' ' + desc).join(',\n')},
        PRIMARY KEY(book_id, page, seq),
        CHECK(page >= 1 AND seq >= 0 AND level >= 0)
    );
`

const db = new Database('../server-data/text.db', { fileMustExist: false });
db.pragma('journal_mode = WAL'); //makes writes to db faster

// write bjt books info
db.exec(createBookTable)
const insertBook = db.prepare(`INSERT INTO book VALUES (${questionStr(Object.keys(booksColumns).length)})`)
Object.entries(bjtBooksInfo).forEach(([id, info]) => insertBook.run(id, ...Object.values(info).slice(0, 7)))

// write BJT pali and sin_bjt
db.exec(createGenericTable('pali', paliColumns))
const insertPali = db.prepare(`INSERT INTO pali VALUES (${questionStr(Object.keys(paliColumns).length)})`)
db.exec(createGenericTable('sin_bjt', transColumns))
const insertSinh = db.prepare(`INSERT INTO sin_bjt VALUES (${questionStr(Object.keys(transColumns).length)})`)
populateBJTText()

function populateBJTText() {
    const dataInputFolder = '../../tipitaka.lk/public/static/text'
    const filesFilter = /^dn-|^mn-|^sn-|^an-|^kn-|^ap-|^vp-/
    const inputFiles = fs.readdirSync(dataInputFolder).filter(name => filesFilter.test(name)).sort()
    console.log(`num files selected ${inputFiles.length}`)
    const dedup = {}

    for (const filename of inputFiles) {
        const obj = JSON.parse(fs.readFileSync(path.join(dataInputFolder, filename)))
        const paliOnly = /^ap-pat/.test(filename)//, isAtta = filename.startsWith('atta-')
        const bookInfo = bjtBooksInfo[obj.bookId], paliList = [], sinhList = []
        for (const page of obj.pages) {
            console.assert(paliOnly || page.pali.entries.length == page.sinh.entries.length, `pali and sinh entry counts are different ${filename}:${page.pageNum}`)
            const realPage = page.pageNum + obj.pageOffset + bookInfo.pageNumOffset
            let seq = page.pali.sequenceStart || 0 // mn-1-x has cases where the page is split between two json files - making book/page repeat
            paliList.push(...page.pali.entries.map(e => [obj.bookId, realPage, seq++, typeToInt[e.type], e.level, e.text, e.keyOffset, e.noAudio == true ? 1 : null]))
            paliList.push(...page.pali.footnotes.map(fn => [obj.bookId, realPage, seq++, typeToInt['footnote'], null, fn.text, null, null]))
            
            if (paliOnly) continue
            seq = page.sinh.sequenceStart || 0 // Note: there would be a gap in seq number of mn-1-2.json first page
            sinhList.push(...page.sinh.entries.map(e => [obj.bookId, realPage, seq++, typeToInt[e.type], e.level, e.text]))
            sinhList.push(...page.sinh.footnotes.map(fn => [obj.bookId, realPage, seq++, typeToInt['footnote'], null, fn.text]))
        }
        // write one file at a time so that the valuesList is not too big
        paliList.forEach(values => insertPali.run(...values))
        sinhList.forEach(values => insertSinh.run(...values))
        console.log(`file: ${filename} inserted pali: ${paliList.length} and sinh: ${sinhList.length} rows`)
    }
}

db.exec(createGenericTable('eng_thani', transColumns))
const insertTrans = db.prepare(`INSERT INTO eng_thani VALUES (${Object.keys(transColumns).map(c => '@'+c).join(', ')})`)
populateAlignedText('eng_thani')

function populateAlignedText(collName) {
    const dataInputFolder = path.join('align', collName)
    const inputFiles = fs.readdirSync(dataInputFolder).sort()
    for (const filename of inputFiles) {
        const obj = JSON.parse(fs.readFileSync(path.join(dataInputFolder, filename)))
        console.assert(obj.pali.rows.length >= obj.eng.text.length, `file: ${filename}, not enough pali rows to cover the eng text`)
        const rowList = obj.eng.text.map((text, i) => {
            const row = obj.pali.rows[i]
            row.text = text.trim()
            delete row.key_offset
            return row
        })
        rowList.forEach(row => insertTrans.run(row))
        console.log(`file: ${filename} inserted ${collName}: ${rowList.length}`)
    }
}

db.exec('VACUUM;')
db.pragma('journal_mode = DELETE'); // delete shm/wal files
db.close()