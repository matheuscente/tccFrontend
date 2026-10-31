<template>
  <div>
    <template v-if="!editing">
      <div class="d-flex align-start ga-2">
        <h3 class="text-title-large font-weight-bold flex-grow-1">{{ note.title || "Sem título" }}</h3>
        <v-btn icon="mdi-pencil-outline" size="small" variant="text" :aria-label="`Editar nota ${note.title}`" @click="startEdit" />
        <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" :aria-label="`Excluir nota ${note.title}`" @click="remove" />
      </div>
      <MarkdownView v-if="note.content.trim()" :source="note.content" class="mt-2" />
      <p v-else class="text-body-medium text-medium-emphasis mt-2">Nota vazia. Clique no lápis para escrever.</p>
    </template>

    <v-form v-else ref="form" @submit.prevent="save">
      <v-text-field v-model="title" label="Título" :rules="[required('Título'), maxLength(150, 'Título')]" class="mb-2" />
      <MarkdownEditor v-model="content" />
      <div class="d-flex justify-end ga-2 mt-3">
        <v-btn variant="text" @click="editing = false">Cancelar</v-btn>
        <v-btn type="submit" color="primary" variant="flat" :loading="saving">Salvar</v-btn>
      </div>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { VForm } from "vuetify/components";
import MarkdownView from "@/components/MarkdownView.vue";
import MarkdownEditor from "@/components/MarkdownEditor.vue";
import { useApi } from "@/composables/useApi";
import { useConfirmStore } from "@/stores/confirm.store";
import { maxLength, required } from "@/utils/rules";
import type { NoteDTO } from "@/modules/notes/models/DTO/NoteDto";
import { noteService } from "@/modules/notes/services/note.service";

const props = defineProps<{ note: NoteDTO }>();
const emit = defineEmits<{ updated: [note: NoteDTO], removed: [id: string] }>();

const { run, runOne } = useApi();
const confirm = useConfirmStore();

const editing = ref(false);
const saving = ref(false);
const form = ref<VForm | null>(null);
const title = ref("");
const content = ref("");

const startEdit = () => {
  title.value = props.note.title;
  content.value = props.note.content;
  editing.value = true;
};

const save = async () => {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    const updated = await runOne(noteService.update(props.note.id, { title: title.value.trim(), content: content.value }), "Nota salva.");
    if (updated) {
      emit("updated", updated);
      editing.value = false;
    }
  } finally {
    saving.value = false;
  }
};

const remove = async () => {
  const ok = await confirm.ask({ title: "Excluir nota", message: `Excluir a nota "${props.note.title}"?`, confirmText: "Excluir" });
  if (!ok) return;
  if (await run(noteService.remove(props.note.id), "Nota excluída.")) emit("removed", props.note.id);
};
</script>
