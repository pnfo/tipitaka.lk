import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import BookpageView from '@/views/BookpageView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:lang(sinh|romn)',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/:lang(sinh|romn)/:key/:offset?',
      name: 'bookpage', 
      component: BookpageView,
    }
  ]
})

export default router