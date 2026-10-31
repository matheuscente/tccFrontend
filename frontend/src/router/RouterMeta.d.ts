import "vue-router"

declare module 'vue-router' {
    interface RouteMeta {
        title?: string
        requiresAuth?: boolean
        requiresAdmin?: boolean
        guestOnly?: boolean
        adminMode?: boolean
        // tela de leitura sem menu lateral e sem barra superior
        focus?: boolean
    }
}
