import { defineStore } from 'pinia';
import { reactive } from 'vue';
import { queryDb, rootNodes } from '../utils';

export const useTreeStore = defineStore('treeStore', () => {
    const nodes = reactive(rootNodes);

    // get and update node children if not already fetched before
    async function getChildren(key) {
        if (!nodes[key]?.children) {
            try {
                const rows = await queryDb(`SELECT * from tree WHERE parent = '${key}'`)
                rows.forEach(row => nodes[row.key] = row)
                nodes[key].children = rows.map(row => row.key)
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
                rows.forEach(row => nodes[row.key] = row) // first add the rows to nodes
                rows.forEach(row => { // then update children in nodes - the order of the returned rows important
                    if (nodes[row.parent].children) {
                        nodes[row.parent].children.push(row.key);
                    } else {
                        nodes[row.parent].children = [row.key];
                    }
                }) 
            } catch (error) {
                console.error(`Error opening up to ${key}`, error);
            }
        }
        parents.forEach(p => nodes[p].open = true)
    }

    return {
        nodes,
        getChildren,
        openUpto,
    };
});
