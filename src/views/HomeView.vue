<script setup>
import VAlert from '@/components/VAlert.vue';
import {AtSignIcon, SendIcon} from 'lucide-vue-next'

const examples = [
  ['alu.', 'අලු, අළු'],
  ['nuvana.', 'නුවණ, නුවන'],
  ['kala.', 'කල, කලා, කාල, කළ, කාළ, කළා'],
  ['naengu', 'නැඟු..., නැංගු...'],
  ['sankra', 'සංක්‍ර..., සංක්‍රා...'],
  ['krumiya', 'කෘමියා']
]

</script>

<template>
  <div class="m-1">
      <VAlert :border="true" color="warning">
        <div>
          මෙම ශබ්දකෝෂයේ පාරිභාෂික වචන 5600 පමණ තිබෙන නමුත් ඉන් බොහොමයක් වචන වලට අදාළ ඉංග්‍රීසි වචන ඇතුළත් වී නොමැත. මේ වචන ඇතුළු කිරීමට ඔබට උපකාර කළ හැකි නම්
          <SendIcon class="inline" size="18"/> path.nirvana <AtSignIcon class="inline" size="18" /> gmail.com වෙත පණිවුඩයක් එවන්න.
        </div>
      </VAlert>

      <div class="text-7xl text-center mt-4 text-yellow-800 dark:text-yellow-300">අරුත.lk</div>

      <ul class="mx-2 mt-4 list-[circle] list-inside">
        <li>සෙවීම සඳහා උඩ කොටුවේ සෙවුම් පද යොදන්න.</li>
        <li>ඉංග්‍රීසි අකුරු හෝ සිංහල අකුරු යොදා ගෙන සෙවීම සිදු කළ හැකිය. උදා. <RouterLink to="/search/janaka">janaka</RouterLink>, <RouterLink to="/search/ජනක">ජනක</RouterLink>, <RouterLink to="/search/jaනක">jaනක</RouterLink></li>
        <li>සෙවුම් පදයෙන් ආරම්භ වන සියලුම වචන පෙන්වන අතර සෙවුම් පදයෙන් අවසන් වීම ද සිදුවිය යුතු නම් අගට තිතක් යොදන්න. උදා <RouterLink to="/search/ජනක.">ජනක.</RouterLink></li>
        <li>අක්ෂර වින්‍යාසය හෝ නණලළ භේදය නොසලකා සෙවීම කළ යුතු නම් ඉංග්‍රීසි අකුරු යොදාගන්න. උදා <RouterLink to="/search/naya.">naya.</RouterLink> යන සෙවුම මගින් “නය” සහ “ණය” යන වචන දෙකටම අදාළ ප්‍රතිඵල ලැබේ.
          එමගින් යම් වචනයක නිවැරදි අක්ෂර වින්‍යාසය ඔබට සොයාගත හැකිය.</li>
      </ul>

      <table class="max-w-[600px] w-full my-3 border-collapse">
        <thead class="bg-gray-300 dark:bg-gray-700">
          <tr>
            <td class="border border-gray-300 p-2">ඉංග්‍රීසියෙන් සොයන අයුරු</td>
            <td class="border border-gray-300 p-2">සිංහලෙන් ලැබෙන ප්‍රතිඵල</td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="([first, second], i) in examples" :key="i" class="even:bg-gray-200 even:dark:bg-gray-800">
            <td class="border border-gray-300 p-2 text-subtitle-1">
              <RouterLink :to="'/search/' + first">{{ first }}</RouterLink>
            </td>
            <td class="border border-gray-300 p-2">{{ second }}</td>
          </tr>
        </tbody>
      </table>

      <!-- <VAlert color="info">අන්තර්ජාලය නැතිව Offline භාවිතා කළ හැකි මෘදුකාංග පහතින් බාගත කරගන්න.</VAlert>
      <div class="flex flex-wrap gap-3 download-software-list">
          <a href="https://play.google.com/store/apps/details?id=lk.tipitaka.main" target="_blank"><img src="/images/android2.png"></a>
          <a href="https://github.com/pnfo/arutha.lk/releases/" target="_blank"><img src="/images/windows.png"></a>
          <a href="https://github.com/pnfo/arutha.lk/releases/" target="_blank"><img src="/images/macos2.png"></a>
          <a href="https://github.com/pnfo/arutha.lk/releases/" target="_blank"><img src="/images/linux.png"></a>
      </div> -->
  </div>
</template>

<style lang="css" scoped>
a {
  @apply text-blue-600 dark:text-blue-400
}
.download-software-list img { 
  @apply h-14 invert-[.95] dark:invert-0 mx-2;
}

</style>
