import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import TextView from '@/views/TextView.vue'
import BookView from '@/views/BookView.vue'
import HelpView from '@/views/HelpView.vue'
import CollectionListView from '@/views/CollectionListView.vue'
import { Script } from '@/pali-converter'
import { TranslationInfo } from './utils'

const scriptStr = Object.values(Script).join('|')
const collectionStr = [...Object.values(Script), ...Object.keys(TranslationInfo)].join('|')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'collectionlist',
      component: CollectionListView,
    },
    {
      path: `/help/:catchAll(.*)`, // or just  /help/.* without the capture
      name: 'help',
      component: HelpView,
    },
    {
      path: `/:collection(${collectionStr})`,
      name: 'home',
      component: HomeView,
    },
    {
      path: `/:collection(${collectionStr})/book/:book(\\d+)`,
      name: 'book', 
      component: BookView,
    },
    {
      path: `/:collection(${collectionStr})/:key/:offset?`,
      name: 'text', 
      component: TextView,
    },
  ]
})

export default router