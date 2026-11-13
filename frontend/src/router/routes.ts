import type { RouteMeta, RouteRecordRaw } from "vue-router";
import { routeProps } from "./RouteProps";

type PageKey = Exclude<keyof typeof routeProps, "index">;

const page = (key: PageKey, component: RouteRecordRaw["component"], meta: RouteMeta = {}): RouteRecordRaw => ({
  path: routeProps[key].path,
  name: routeProps[key].name,
  component,
  meta: { title: routeProps[key].title, ...meta },
} as RouteRecordRaw);

// endereços antigos das telas que viraram abas da Biblioteca
const legacyLibraryPaths = [
  { path: "/files", tab: "files" },
  { path: "/notes", tab: "notes" },
  { path: "/questions", tab: "questions" },
  { path: "/activities", tab: "activities" },
];

const routes: RouteRecordRaw[] = [
  {
    path: routeProps.index.path,
    redirect: routeProps.index.redirect,
  },

  page("login", () => import("@/modules/auth/pages/LoginPage.vue"), { guestOnly: true }),
  page("register", () => import("@/modules/user/pages/RegisterPage.vue"), { guestOnly: true }),
  page("forgotPassword", () => import("@/modules/auth/pages/ForgotPasswordPage.vue"), { guestOnly: true }),
  page("resetPassword", () => import("@/modules/auth/pages/ResetPasswordPage.vue")),

  {
    path: "/",
    component: () => import("@/layouts/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      page("home", () => import("@/modules/dashboard/pages/DashboardPage.vue")),
      page("courses", () => import("@/modules/courses/pages/CoursesPage.vue")),
      page("courseDetail", () => import("@/modules/courses/pages/CourseDetailPage.vue")),
      page("moduleDetail", () => import("@/modules/courses/pages/CourseDetailPage.vue")),
      page("disciplineDetail", () => import("@/modules/courses/pages/CourseDetailPage.vue")),
      page("library", () => import("@/modules/library/pages/LibraryPage.vue")),
      page("courseReader", () => import("@/modules/study/pages/StudyReaderPage.vue"), { focus: true }),
      page("moduleReader", () => import("@/modules/study/pages/StudyReaderPage.vue"), { focus: true }),
      page("disciplineReader", () => import("@/modules/study/pages/StudyReaderPage.vue"), { focus: true }),
      page("goals", () => import("@/modules/goals/pages/GoalsPage.vue")),
      page("study", () => import("@/modules/study/pages/StudyPage.vue")),
      page("activityDetail", () => import("@/modules/activities/pages/ActivityDetailPage.vue")),
      page("activityAnswer", () => import("@/modules/activities/pages/ActivityAnswerPage.vue")),
      page("attemptResult", () => import("@/modules/activities/pages/AttemptResultPage.vue")),
      page("stats", () => import("@/modules/stats/pages/StatsPage.vue")),
      page("tickets", () => import("@/modules/tickets/pages/TicketsPage.vue")),
      page("ticketDetail", () => import("@/modules/tickets/pages/TicketDetailPage.vue")),
      page("profile", () => import("@/modules/user/pages/ProfilePage.vue")),

      page("adminDashboard", () => import("@/modules/admin/pages/AdminDashboardPage.vue"), { requiresAdmin: true }),
      page("adminUsers", () => import("@/modules/admin/pages/AdminUsersPage.vue"), { requiresAdmin: true }),
      page("adminUserDetail", () => import("@/modules/admin/pages/AdminUserDetailPage.vue"), { requiresAdmin: true }),
      page("adminTickets", () => import("@/modules/tickets/pages/TicketsPage.vue"), { requiresAdmin: true, adminMode: true }),
      page("adminTicketDetail", () => import("@/modules/tickets/pages/TicketDetailPage.vue"), { requiresAdmin: true, adminMode: true }),
    ],
  },

  ...legacyLibraryPaths.map(({ path, tab }) => ({ path, redirect: { name: routeProps.library.name, query: { tab } } })),

  page("notFound", () => import("@/pages/NotFoundPage.vue")),
];

export {
    routes
}
