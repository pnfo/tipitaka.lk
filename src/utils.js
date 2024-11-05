import { Script, isScript } from "./pali-converter/index.js" //dev scripts complain without index.js here

const rootNodeCommon = { leaf: 0, seq: 0, translations: ['sin_bjt'], }
export const rootNodes = { // page can be found in firstPageId in bookinfo, default seq of 0 is good enough
    'vp': { key: 'vp', text: 'විනයපිටක', level: 7, book_id: 1, parent: '', page: 25, nextKey: 'vp-prj', ...rootNodeCommon }, 
    'sp': { key: 'sp', text: 'සුත්තපිටක', level: 7, book_id: 10, parent: '', page: 15, nextKey: 'dn', ...rootNodeCommon,
        open: true, children: ['dn', 'mn', 'sn', 'an', 'kn'] },
    'ap': { key: 'ap', text: 'අභිධම්මපිටක', level: 7, book_id: 45, parent: '', page: 37, nextKey: 'ap-dhs', ...rootNodeCommon },

    'dn': { key: 'dn', text: 'දීඝනිකාය', level: 6, book_id: 10, parent: 'sp', page: 15, nextKey: 'dn-1', ...rootNodeCommon },
    'mn': { key: 'mn', text: 'මජ්ඣිමනිකාය', level: 6, book_id: 13, parent: 'sp', page: 19, nextKey: 'mn-1', ...rootNodeCommon },
    'sn': { key: 'sn', text: 'සංයුත්තනිකාය', level: 6, book_id: 16, parent: 'sp', page: 25, nextKey: 'sn-1', ...rootNodeCommon },
    'an': { key: 'an', text: 'අඞ්ගුත්තරනිකාය', level: 6, book_id: 22, parent: 'sp', page: 37, nextKey: 'an-1', ...rootNodeCommon },
    'kn': { key: 'kn', text: 'ඛුද්දකනිකාය', level: 6, book_id: 28, parent: 'sp', page: 27, nextKey: 'kn-khp', ...rootNodeCommon },
}

// codes from https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
export const Language = {
    SIN: 'sin',
    ENG: 'eng',
    THA: 'tha',
}
export const LanguageInfo = {
    [Language.SIN]: { name: 'සිංහල', flag: 'sri-lanka.svg', },
    [Language.ENG]: { name: 'English', flag: 'uk.svg', },
    [Language.THA]: { name: 'ไทย', flag: 'thailand.svg', },
}
export const TranslationInfo = {
    sin_bjt:   { name: 'බුද්ධ ජයන්ති', language: Language.SIN, script: Script.SINH, flag: 'sri-lanka.svg', description: '', },
    eng_thani: { name: 'Thanissaro', language: Language.ENG, script: Script.LATN, flag: 'uk.svg', description: '', },
}
export const getScriptForCollection = (coll) => isScript(coll) ? coll : TranslationInfo[coll].script

export const typeToInt = {centered: 0, heading: 1, paragraph: 2, gatha: 3, unindented: 4, footnote: 5,}
export const intToType = Object.keys(typeToInt)

export async function queryDb(query, dbname = 'text.db') {
    try {
        const response = await fetch('/sql-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({query, dbname})
        });

        // Check if the response is OK
        if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);

        // Parse the JSON response
        const data = await response.json()
        return data || [] // null sent when zero results
    } catch (error) {
        console.error(error);
        throw error
    }
}

export function textToHtml(text, page, coll) {
    text = text.replace(/\{(.+?)\}/g, `<span class="fn-pointer" page="${page}" coll="${coll}">$1</span>`); // page/coll needed to determine the footnote
    // TODO do something about overlapping tags
    text = text.replace(/##(.*?)##/g, '<span class="highlight">$1</span>') // fts highlight
    text = text.replace(/\*\*(.*?)\*\*/g, '<span class="bold">$1</span>') // using the markdown styles
    text = text.replace(/__(.*?)__/g, '<span class="underlined">$1</span>') // underline
    text = text.replace(/~~(.*?)~~/g, '<span class="strike">$1</span>') // strike through
    text = text.replace(/\$\$(.*?)\$\$/g, '$1') // just get rid of $$
    text = text.replace(/↴/g, '\n') // invisible in pdf - new line
    text = text.replace(/\n/g, '<br>') // if used {white-space: pre-wrap;} css this is not needed
    if (!text) text = ''
    return text
}