<template>
    <template v-if="isScript(collName)">
      <img :src="'/flags/' + PaliScriptInfo.get(collName)[3].f" class="h-6 mx-2 dark:brightness-120">
      {{ PaliScriptInfo.get(collName)[1] }}
    </template>
    <template v-else>
      <img :src="'/flags/' + TranslationInfo[collName].flag" class="h-6 mx-2 dark:brightness-120">
      {{ TranslationInfo[collName].name }}
    </template>
</template>

<script setup>
import { isScript, PaliScriptInfo } from '@/pali-converter'
import { TranslationInfo } from '@/utils'

const props = defineProps({
    collName: {
      type: String,
      default: null
    },
  });
</script>