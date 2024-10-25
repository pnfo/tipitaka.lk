import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import TextView from '@/views/TextView.vue'
import { Script } from '@/pali-converter'
import { TranslationInfo } from './utils'

const collectionStr = [...Object.values(Script), ...Object.keys(TranslationInfo)].join('|')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: `/:collection(${collectionStr})`,
      name: 'home',
      component: HomeView,
    },
    // {
    //   path: `/:script(${scriptsStr})/:key/:offset?`,
    //   name: 'pali', 
    //   component: TextView,
    // },
    {
      path: `/:collection(${collectionStr})/:key/:offset?`,
      name: 'text', 
      component: TextView,
    },
  ]
})

export default router