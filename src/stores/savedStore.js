import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'

// export factory function for creating dynamic stores
export function useSavedStore(storeId, initialObject = {}) {
    return defineStore(storeId, () => {
        const state = reactive(initialObject), isLoaded = ref(false)
        
        function loadState() {
            if (isLoaded.value) return // only call this from client and once
            const stateStr = localStorage.getItem(storeId)
            if (stateStr) Object.assign(state, JSON.parse(stateStr))
            console.log(`${storeId} state loaded from ${stateStr || 'initial object'}`)
            isLoaded.value = true
        }
    
        function setState(name, value) {
            state[name] = value
            // do not save if not already read from storage
            if (isLoaded.value) localStorage.setItem(storeId, JSON.stringify(state))
        }
        function unsetState(name) {
            delete state[name]
            if (isLoaded.value) localStorage.setItem(storeId, JSON.stringify(state))
        }
      
        return { loadState, setState, unsetState, state }
    })()
}

const snackbarTypeToMsg = {
    'link-copied': 'සබැඳිය පිටපත් විය. ඔබට අවශ්‍ය තැනක අලවන්න.',
    'content-copied': 'අන්තර්ගතය පිටපත් විය. අවශ්‍ය තැනක අලවන්න.',
    'bookmark-added': '“param” යන වචනයට තරු ලකුණක් එක් කළා.',
    'bookmark-removed': '“param” යන වචනයෙන් තරු ලකුණ ඉවත් කළා.',
}
const updateDarkMode = (dark) => {
    if (dark) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
}
export const useSettingsStore = defineStore('settings-parent', () => {
    const savedStore = useSavedStore('settings', {
        darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        fontSize: 0, // use as fontSize: 18 + state.fontSize + 'px'
        dicts: [0, 1],
    }), snackbar = reactive({model: false})

    const fontSizeStyle = computed(() => ({fontSize: 18 + savedStore.state.fontSize + 'px'}))
    function loadSettings() {
        savedStore.loadState()
        // On page load or when changing themes, best to add inline in `head` to avoid FOUC
        updateDarkMode(savedStore.state.darkMode)
    }
    function toggleDarkMode() {
        savedStore.setState('darkMode', !savedStore.state.darkMode)
        updateDarkMode(savedStore.state.darkMode)
    }

    function setSetting(name, value) {
        savedStore.setState(name, value)
    }

    function setSnackbar({ timeout, message, type, param }) {
        if (!message && type) message = snackbarTypeToMsg[type]
        if (param && message) message = message.replace(/param/g, param)
        if (message) {
            Object.assign(snackbar, { model: true, message })
            setTimeout(() => Object.assign(snackbar, { model: false }), timeout || 2000)
        }
    }

    return {
        loadSettings, setSetting, settings: savedStore.state, fontSizeStyle, 
        setSnackbar, snackbar, toggleDarkMode }
})