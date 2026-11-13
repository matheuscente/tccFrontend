import { computed, reactive } from "vue";
import { useApi } from "@/composables/useApi";
import { useLatest } from "@/composables/useLatest";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { useStructureStore } from "@/stores/structure.store";
import { fileService } from "@/modules/files/services/file.service";
import { noteService } from "@/modules/notes/services/note.service";
import { questionService } from "@/modules/questions/services/question.service";
import { activityService } from "@/modules/activities/services/activity.service";
import { goalService } from "@/modules/goals/services/goal.service";
import { studySessionService } from "@/modules/study/services/study-session.service";
import { statsService } from "@/modules/stats/services/stats.service";
import type { Scope } from "@/modules/courses/models/interfaces/Scope.interface";
import type { StoredFileDTO } from "@/modules/files/models/DTO/StoredFileDto";
import type { NoteDTO } from "@/modules/notes/models/DTO/NoteDto";
import type { QuestionDTO } from "@/modules/questions/models/DTO/QuestionDto";
import type { ActivityDTO } from "@/modules/activities/models/DTO/ActivityDto";
import type { GoalProgressDTO } from "@/modules/goals/models/DTO/GoalProgressDto";
import type { StudySessionDTO } from "@/modules/study/models/DTO/StudySessionDto";
import type { StudySummaryDTO } from "@/modules/stats/models/DTO/StudySummaryDto";
import type { PerformanceDTO } from "@/modules/stats/models/DTO/PerformanceDto";
import type { HubTab } from "@/modules/courses/models/Types/HubTab";
import { scopeQuery } from "@/utils/scope";

// tudo o que está vinculado a um curso, módulo ou disciplina (incluindo os níveis dentro dele)
export const useScopeContent = (scope: () => Scope) => {
  const auth = useAuthStore();
  const structure = useStructureStore();
  const { run, runOne } = useApi();
  const latest = useLatest();

  const state = reactive({
    loading: true,
    files: [] as StoredFileDTO[],
    notes: [] as NoteDTO[],
    questions: [] as QuestionDTO[],
    activities: [] as ActivityDTO[],
    goals: [] as GoalProgressDTO[],
    sessions: [] as StudySessionDTO[],
    summary: null as StudySummaryDTO | null,
    performance: null as PerformanceDTO | null,
  });

  const counts = computed<Partial<Record<HubTab, number>>>(() => ({
    files: state.files.length,
    notes: state.notes.length,
    questions: state.questions.length,
    activities: state.activities.length,
    goals: state.goals.length,
    sessions: state.sessions.filter((session) => session.status === "COMPLETED").length,
  }));

  const load = async () => {
    if (!auth.userId) return;
    const request = latest.next();
    const current = scope();
    state.loading = true;
    try {
      const [files, notes, questions, activities, goals, sessions, summary, performance] = await Promise.all([
        run(fileService.listByUser(auth.userId, current)),
        run(noteService.listByUser(auth.userId, current)),
        run(questionService.listByUser(auth.userId, current)),
        run(activityService.listByUser(auth.userId)),
        run(goalService.progress()),
        run(studySessionService.listByUser(auth.userId)),
        runOne(statsService.summary(scopeQuery(current))),
        runOne(statsService.performance(scopeQuery(current))),
      ]);
      if (!latest.isLatest(request)) return;

      state.files = files ?? [];
      state.notes = notes ?? [];
      state.questions = questions ?? [];
      state.activities = (activities ?? []).filter((activity) => structure.contains(current, activity));
      state.goals = (goals ?? []).filter((goal) => structure.contains(current, goal.scope));
      state.sessions = (sessions ?? []).filter((session) => structure.contains(current, session));
      state.summary = summary;
      state.performance = performance;
    } finally {
      if (latest.isLatest(request)) state.loading = false;
    }
  };

  return { state, counts, load };
};
