
export const rootNodes = { // page can be found in firstPageId in bookinfo, default seq of 0 is good enough
    'vp': { key: 'vp', text: 'විනයපිටක', level: 7, book_id: 1, parent: '', leaf: 0, page: 25, }, 
    'sp': { key: 'sp', text: 'සුත්තපිටක', level: 7, book_id: 10, parent: '', leaf: 0, page: 15, open: true, children: ['dn', 'mn', 'sn', 'an', 'kn'] },
    'ap': { key: 'ap', text: 'අභිධම්මපිටක', level: 7, book_id: 45, parent: '', leaf: 0, page: 37, },

    'dn': { key: 'dn', text: 'දීඝනිකාය', level: 6, book_id: 10, parent: 'sp', leaf: 0, page: 15, },
    'mn': { key: 'mn', text: 'මජ්ඣිමනිකාය', level: 6, book_id: 13, parent: 'sp', leaf: 0, page: 19, },
    'sn': { key: 'sn', text: 'සංයුත්තනිකාය', level: 6, book_id: 16, parent: 'sp', leaf: 0, page: 25, },
    'an': { key: 'an', text: 'අඞ්ගුත්තරනිකාය', level: 6, book_id: 22, parent: 'sp', leaf: 0, page: 37, },
    'kn': { key: 'kn', text: 'ඛුද්දකනිකාය', level: 6, book_id: 28, parent: 'sp', leaf: 0, page: 27, },
}


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
        const data = await response.json();
        //console.log('Success:', data);
        return data || []
    } catch (error) {
        console.error(error);
        throw error
    }
}