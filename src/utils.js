
export const rootNodes = { // page can be found in firstPageId in bookinfo, default seq of 0 is good enough
    'vp': { key: 'vp', text: 'විනයපිටක', level: 7, book_id: 1, parent: '', leaf: 0, page: 25, seq: 0, translations: 'sinh', }, 
    'sp': { key: 'sp', text: 'සුත්තපිටක', level: 7, book_id: 10, parent: '', leaf: 0, page: 15, seq: 0, translations: 'sinh', 
        open: true, children: ['dn', 'mn', 'sn', 'an', 'kn'] },
    'ap': { key: 'ap', text: 'අභිධම්මපිටක', level: 7, book_id: 45, parent: '', leaf: 0, page: 37, seq: 0, translations: 'sinh', },

    'dn': { key: 'dn', text: 'දීඝනිකාය', level: 6, book_id: 10, parent: 'sp', leaf: 0, page: 15, seq: 0, translations: 'sinh', },
    'mn': { key: 'mn', text: 'මජ්ඣිමනිකාය', level: 6, book_id: 13, parent: 'sp', leaf: 0, page: 19, seq: 0, translations: 'sinh', },
    'sn': { key: 'sn', text: 'සංයුත්තනිකාය', level: 6, book_id: 16, parent: 'sp', leaf: 0, page: 25, seq: 0, translations: 'sinh', },
    'an': { key: 'an', text: 'අඞ්ගුත්තරනිකාය', level: 6, book_id: 22, parent: 'sp', leaf: 0, page: 37, seq: 0, translations: 'sinh', },
    'kn': { key: 'kn', text: 'ඛුද්දකනිකාය', level: 6, book_id: 28, parent: 'sp', leaf: 0, page: 27, seq: 0, translations: 'sinh', },
}

// codes from https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
export const Language = {
    SIN: 'sin',
    ENG: 'eng',
    THA: 'tha',
}
export const translationInfo = {
    sin_bjt: { language: Language.SIN, name: '', description: '', },
    eng_thani: { language: Language.ENG, nanme: '', description: '', },
}

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