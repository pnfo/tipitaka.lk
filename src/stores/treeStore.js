import { defineStore } from 'pinia';
import { reactive } from 'vue';
import { queryDb, rootNodes } from '../utils';

export const useTreeStore = defineStore('treeStore', () => {
    const nodes = reactive({});
    function init() {
        addRowsToNodes(Object.values(rootNodes))
    }
    const addRowsToNodes = (rows) => {
        rows.forEach(row => { // first add the rows to nodes
            row.translations = row.translations.split(',').filter(t => !!t.trim())
            nodes[row.key] = row 
        })
        rows.forEach(row => { // then update children in nodes - the order of the returned rows important
            if (!row.parent) return // root nodes
            if (nodes[row.parent].children) {
                if (!nodes[row.parent].children.includes(row.key)) { // this check might not be necessary, but wouldn't hurt incase the child was loaded twice
                    nodes[row.parent].children.push(row.key);
                }
            } else {
                nodes[row.parent].children = [row.key];
            }
        })
    }

    // get and update node children if not already fetched before
    async function getChildren(key) {
        if (!nodes[key]?.children) {
            try {
                const rows = await queryDb(`SELECT * from tree WHERE parent = '${key}'`)
                addRowsToNodes(rows)
                // rows.forEach(row => addRowToNodes(row))
                // nodes[key].children = rows.map(row => row.key)
            } catch (error) {
                console.error(`Error fetching children for key ${key}`, error);
            }
        }
    }
  
    function getParents(key) {
        const parents = []
        while (key.includes('-')) {
            key = key.replace(/-\w+?$/, '')
            parents.push(key)
        }
        return parents
    }

    // get data for all parents of the key and mark them as open
    async function openUpto(key) {
        const parents = getParents(key)
        if (!nodes[key]) {
            try {
                const rows = await queryDb(`SELECT * from tree WHERE parent IN (${parents.map(p => "'" + p + "'")})`)
                addRowsToNodes(rows)
            } catch (error) {
                console.error(`Error opening up to ${key}`, error);
            }
        }
        parents.forEach(p => nodes[p].open = true)
    }

    return {
        nodes,
        init,
        getChildren,
        openUpto,
    };
});
