const routeProps = {
    notFound: { name: "NotFound", path: "/:pathMatch(.*)*", title: "Página não encontrada" },

    login: { name: "Login", path: "/login", title: "Login" },
    register: { name: "Register", path: "/signin", title: "Cadastre-se" },
    forgotPassword: { name: "ForgotPassword", path: "/forgot-password", title: "Esqueci minha senha" },
    resetPassword: { name: "ResetPassword", path: "/reset-password", title: "Redefinir senha" },

    index: { path: "/", redirect: "/dashboard" },

    home: { name: "home", path: "/dashboard", title: "Início" },
    courses: { name: "Courses", path: "/courses", title: "Cursos" },
    courseDetail: { name: "CourseDetail", path: "/courses/:id", title: "Curso" },
    moduleDetail: { name: "ModuleDetail", path: "/courses/:id/modules/:moduleId", title: "Módulo" },
    disciplineDetail: { name: "DisciplineDetail", path: "/courses/:id/modules/:moduleId/disciplines/:disciplineId", title: "Disciplina" },
    library: { name: "Library", path: "/library", title: "Biblioteca" },
    courseReader: { name: "CourseReader", path: "/courses/:id/study", title: "Modo estudo" },
    moduleReader: { name: "ModuleReader", path: "/courses/:id/modules/:moduleId/study", title: "Modo estudo" },
    disciplineReader: { name: "DisciplineReader", path: "/courses/:id/modules/:moduleId/disciplines/:disciplineId/study", title: "Modo estudo" },
    goals: { name: "Goals", path: "/goals", title: "Metas" },
    study: { name: "Study", path: "/study", title: "Sessões de estudo" },
    activityDetail: { name: "ActivityDetail", path: "/activities/:id", title: "Atividade" },
    activityAnswer: { name: "ActivityAnswer", path: "/activities/:id/answer", title: "Responder atividade" },
    attemptResult: { name: "AttemptResult", path: "/attempts/:id", title: "Resultado" },
    stats: { name: "Stats", path: "/stats", title: "Estatísticas" },
    tickets: { name: "Tickets", path: "/support", title: "Suporte" },
    ticketDetail: { name: "TicketDetail", path: "/support/:id", title: "Chamado" },
    profile: { name: "Profile", path: "/profile", title: "Meu perfil" },

    adminDashboard: { name: "AdminDashboard", path: "/admin", title: "Painel administrativo" },
    adminUsers: { name: "AdminUsers", path: "/admin/users", title: "Usuários" },
    adminUserDetail: { name: "AdminUserDetail", path: "/admin/users/:id", title: "Acompanhamento do usuário" },
    adminTickets: { name: "AdminTickets", path: "/admin/tickets", title: "Chamados" },
    adminTicketDetail: { name: "AdminTicketDetail", path: "/admin/tickets/:id", title: "Chamado" },

} as const

export {
    routeProps
}
