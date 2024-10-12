import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import { queryDb } from '../utils';
import { useTreeStore } from './treeStore';
import { useRoute, useRouter } from 'vue-router'

const pagesPerSection = 3

export const useTextStore = defineStore('textStore', () => {
    const tabs = reactive([]), activeTab = ref(-1)
    const treeStore = useTreeStore()
    const router = useRouter()

    async function addTab(key) {
        const node = treeStore.nodes[key]
        const newTab = {node, text: [], error: '', isLoading: ref(false), section: 0}
        tabs.push(newTab)
        activeTab.value = tabs.length - 1
        await fetchTextSection(tabs.length - 1)
    }
    function removeTab(i) {
        tabs.splice(i, 1)
        if (i == activeTab.value) {
            activeTab.value = tabs.length - 1 // make the last tab active
        } else if (activeTab.value >= i) {
            activeTab.value--
        } // else do nothing

        if (activeTab.value >= 0) {
            router.replace(`/sinh/${tabs[activeTab.value].node.key}`)
        } else { // all tabs closed
            router.replace(`/sinh`)
        }
        console.log(`activeTab ${activeTab.value}, tabs length ${tabs.length}`)
    }
    
    function makeActive(i) {
        activeTab.value = i
        router.replace(`/sinh/${tabs[activeTab.value].node.key}`)
    }

    async function fetchTextSection(tabIndex) {
        const tab = tabs[tabIndex]
        if (!tab.node || tab.section < 0 || tab.isLoading) return
        
        try {
            const {book_id, page, seq = 0} = tab.node
            const firstSectionSelect = tab.section ? '' : `page = ${page} AND seq >= ${seq} OR `,
                sectionStartPage = page + tab.section * pagesPerSection + 1

            const query = `SELECT * FROM text WHERE book_id = ${book_id} AND language = 0 AND 
                (${firstSectionSelect} page BETWEEN ${sectionStartPage} and ${sectionStartPage + pagesPerSection}) ORDER BY page ASC, seq ASC`
            console.log(query)
    
            tab.isLoading = true
            const rows = await queryDb(query)
            if (!rows) { // null sent when zero results
                tab.section = -1 // can not fetch further - book finished
            } else {
                tab.text = [...tab.text, ...rows]
                tab.section++
            }
        } catch(e) {
            console.log(e)
            tab.error = e.message
        } finally {
            tab.isLoading = false
        }
    }

    return {
        tabs,
        activeTab,
        addTab,
        removeTab,
        makeActive,
        fetchTextSection,
    };
});
