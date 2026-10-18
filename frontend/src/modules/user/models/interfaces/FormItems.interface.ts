import type { Ref } from "vue";


export interface FormItems  {
    label: string,
    type: string,
    rules: any,
    model: Ref<string | string>,
    errorMessage: Ref<string | undefined>
  }