import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3';
import { typeToInt } from '../src/utils.js';

// list of audio files and label files for each book. Will need to read the audio files in order
const bookToAudio = { 
    1: ["vp-prj"], 
    2: ["vp-pct-1"],
    3: ["vp-pct-2"],
    4: ["vp-mv-(1-|[2-5])"], // 1- needed to prevent 10 from being included
    5: ["vp-mv-([6-9]|10)"],
    6: ["vp-cv-(1-|2|3|4)"],
    7: ["vp-cv-([5-9]|10|11|12)"],
    8: ["vp-pv-(1-|2-|3|4)"],
    9: ["vp-pv-([5-9]|[1-2][0-9])"],
    10: ["dn-1"],
    11: ["dn-2"],
    12: ["dn-3"],
    13: ["mn-1"],
    14: ["mn-2"],
    15: ["mn-3"],
    16: ["sn-1"],
    17: ["sn-2"],
    18: ["sn-3"],
    19: ["sn-4"],
    20: ["sn-5-(1-|[2-6])"],
    21: ["sn-5-(7|8|9|10|11|12)"],
    22: ["an-(1-|2|3)"],
    23: ["an-4"],
    24: ["an-5"],
    25: ["an-(6|7)"],
    26: ["an-(8|9)"],
    27: ["an-(10|11)"],
    52: ["ap-yam-(1$|[2-5])"],
    53: ["ap-yam-[6-9]"],
    54: ["ap-yam-10"],
}
//const audioMap = JSON.parse(fs.readFileSync('../../tipitaka.lk/public/static/data/file-map.json', 'utf-8'))
const audioInputFolder = '../../tipitaka.lk/dev/audio'
function loadLabels(file) {
    const data = fs.readFileSync(path.join(audioInputFolder, file + '.txt'), 'utf-8')
    return data.split('\n').slice(0, -1) // removes the last empty line (for mac only \n)
        .map(line => {
            const [start, end, label] = line.trim().split('\t').map(n => Math.round(Number(n) * 100))
            return {file, start, end, label}; // 3 fields, start/end/num(starts at 1)
        }) 
}


const audioColumns = {
    voice: 'INTEGER NOT NULL', // set of audio files
    book_id: 'INTEGER NOT NULL',
    page: 'INTEGER NOT NULL',
    seq: 'INTEGER NOT NULL',
    file: 'TEXT NOT NULL',
    start: 'INTEGER NOT NULL', // multiply label start/end by 100 (e.g. 4.420000  6.400000)
    end: 'INTEGER NOT NULL',
}
const createAudioTable = () => `
    DROP TABLE IF EXISTS audio;
    CREATE TABLE IF NOT EXISTS audio (
        ${Object.entries(audioColumns).map(([name, desc]) => name + ' ' + desc).join(',\n')},
        PRIMARY KEY(voice, book_id, page, seq),
        CHECK(voice >= 0 AND book_id >= 1 AND page >= 1 AND seq >= 0)
    );
`
const db = new Database('../server-data/text.db', { fileMustExist: true });
db.exec(createAudioTable())
const insertAudio = db.prepare(`INSERT INTO audio VALUES (${Object.keys(audioColumns).map(c => '@'+c).join(', ')})`)
const entriesByBook = db.prepare(`SELECT * FROM pali WHERE no_audio IS NULL AND book_id = ? AND type != ${typeToInt.footnote}`)
const allLabelFiles = fs.readdirSync(audioInputFolder).filter(name => /\.txt$/.test(name)).map(name => name.split('.')[0])
console.log(`all label files: ${allLabelFiles.length}, books to process: ${Object.keys(bookToAudio).length}`)


// for each book, get entries from db, read all audio/label files, join and write to audio table
Object.entries(bookToAudio).forEach(([bookId, fileFilters]) => {
    const entries = entriesByBook.all(bookId)
    const labelFiles = fileFilters.map(filter => new RegExp(filter))
        .map(filterRe => allLabelFiles.filter(name => filterRe.test(name)))
        .map(files => files.sort((a, b) => { // sort by the key
            const splitA = a.split('-').map(part => isNaN(part) ? part : Number(part));
            const splitB = b.split('-').map(part => isNaN(part) ? part : Number(part));

            for (let i = 0; i < Math.max(splitA.length, splitB.length); i++) {
                if (splitA[i] === undefined) return -1;
                if (splitB[i] === undefined) return 1;
                if (splitA[i] != splitB[i]) return splitA[i] - splitB[i]
            }
            return 0;
        }))
        .flat()
    const labels = labelFiles.map(file => loadLabels(file)).flat()
    console.log(`for book: ${bookId}, num audio files: ${labelFiles.length}, num entries: ${entries.length}, num labels: ${labels.length}, diff: ${entries.length - labels.length}`)
    console.assert(entries.length == labels.length, `entries and labels are not the same length for book ${bookId}`)

    Object.values(entries).forEach((entry, i) => insertAudio.run({voice: 0, ...entry, ...labels[i]}))
})
db.close()

