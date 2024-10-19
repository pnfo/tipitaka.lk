import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import TextView from '@/views/TextView.vue'
import { Script } from '@/pali-converter'

const scriptsStr = Object.values(Script).join('|')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: `/:script(${scriptsStr})`,
      name: 'home',
      component: HomeView,
    },
    {
      path: `/:script(${scriptsStr})/:key/:offset?`,
      name: 'text', 
      component: TextView,
    }
  ]
})

export default router