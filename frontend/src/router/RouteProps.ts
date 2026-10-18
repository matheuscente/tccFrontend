 const routeProps = {
    
    notFound: {
        name: "NotFound",
        path: "/:pathMatch(.*)*",
        title: "Página não econtrada."
    },

    login: {
        name: "Login",
        path: "/login",
        title: "Login"
    },

    register: {
        name: "Register",
        path: "/signin",
        title: "Cadastre-se"
    },

    index: {
        path: "/",
        redirect: "/login"
    }


} as const

export {
    routeProps
}
