<script setup>
import { computed } from 'vue';
import { useTreeStore } from '@/stores/treeStore'
import { useTextStore } from '@/stores/textStore'
import { useSettingsStore } from '../stores/savedStore';
import { useRouter } from 'vue-router'
import { FolderIcon, FolderOpenIcon, TextIcon, FolderDownIcon } from 'lucide-vue-next'
import { convert, Script } from '@/pali-converter'

const treeStore = useTreeStore(), router = useRouter(), settingsStore = useSettingsStore()

const props = defineProps({
    id: String, // key is a reserved property
});

const node = computed(() => treeStore.nodes[props.id])
const isBranch = computed(() => !node.value.leaf) // Check if the node is a branch

const toggleBranch = () => {
    node.value.open = !node.value.open
    treeStore.getChildren(props.id)
}
const handleClick = () => {
    console.log(`clicked on text ${props.id}`)
    const tabLink = useTextStore().addTab(props.id)
    router.push(tabLink) // push instead of replace to add to history
};
const getNodeTitle = (title) => {
    if (settingsStore.settings.paliScript != Script.SI) {
        return convert(title, settingsStore.settings.paliScript, Script.SI)
    }
    return title
}
</script>

<template>
    <div class="">
      <div @click="handleClick" class="cursor-pointer flex items-center">
        <span v-if="isBranch" @click.stop="toggleBranch">
            <FolderOpenIcon v-if="node.open" class="w-5 text-yellow-600"/>
            <FolderDownIcon v-else class="w-5 text-gray-500 hover:animate-bounce" />
        </span>
        <TextIcon v-else class="w-5 text-gray-500" />
        
        <span class="ml-2">{{ getNodeTitle(node.text) }}</span>
      </div>
      
      <!-- If this is a branch node and expanded, show children -->
      <div v-if="isBranch && node.children && node.open" class="ml-6 my-1">
        <TreeNode 
          v-for="(childKey, i) in node.children" 
          :key="childKey"
          :id="childKey"/>
      </div>
    </div>
</template>
  
<style scoped>

</style>
  