<script setup>
import { computed } from 'vue';
import { useTreeStore } from '@/stores/treeStore'
import { useTextStore } from '@/stores/textStore'
import { useRouter } from 'vue-router'
import { FolderIcon, FolderOpenIcon, TextIcon } from 'lucide-vue-next'
const treeStore = useTreeStore(), router = useRouter()

const props = defineProps({
    id: String, // key is a reserved property
});

const node = computed(() => treeStore.nodes[props.id])
// Check if the node is a branch
const isBranch = computed(() => !node.value.leaf);

const toggleBranch = () => {
    node.value.open = !node.value.open
    treeStore.getChildren(props.id)
}
const handleClick = () => {
    // if (isBranch.value) {
        
        
    //     //$emit('expand', props.node);
    // } else {
        console.log(`clicked on text ${props.id}`)
        useTextStore().addTab(props.id)
        router.push(`/sinh/${props.id}`) // push instead of replace to add to history
        //$emit('navigate', props.node);
    // }
};
</script>

<template>
    <div >
      <div @click="handleClick" class="cursor-pointer flex items-center">
        <span v-if="isBranch" @click.stop="toggleBranch">
            <FolderOpenIcon v-if="node.open" class="w-5 text-yellow-600"/>
            <FolderIcon v-else class="w-5 text-gray-500" />
        </span>
        <TextIcon v-else class="w-5 text-gray-500" />
        
        <span class="ml-2">{{ node.text }}</span>
      </div>
      
      <!-- If this is a branch node and expanded, show children -->
      <div v-if="isBranch && node.children && node.open" class="ml-6 my-1">
        <TreeNode 
          v-for="(childKey, i) in node.children" 
          :key="i"
          :id="childKey"/>
      </div>
    </div>
</template>
  
<style scoped>
  /* Additional Tailwind styles for branch and leaf nodes */
</style>
  