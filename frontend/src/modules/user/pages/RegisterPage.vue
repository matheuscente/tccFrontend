<template>
  <v-app>
    <v-main class="register">
      <v-card class="register-card pa-6" elevation="4">
        <v-card-title class="text-h5 text-center">
          Cadastre-se
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="isValid" @submit.prevent="handleRegister">

            <v-text-field v-for="item in formItems" v-bind="defaultInputProps" :v-model="item.model" :error-messages="item.errorMessage.value" :rules="item.rules" :label="item.label" :type="item.type"/>

            <v-alert v-if="registerError" type="error" variant="tonal" class="mb-5 multi-line-alert">
              {{ registerError }}
            </v-alert>


            <div class="d-flex justify-between">

              <v-btn block color="primary" size="large" type="submit" :disabled="!isValid">
              Cadastrar
            </v-btn>
            <v-btn block color="secondary" size="large" class="mt-5" @click="handleBack">
            Voltar
          </v-btn>
            </div>
            
          </v-form>
        </v-card-text>
      </v-card>
    </v-main>
  </v-app>
</template>

<style scoped>
.multi-line-alert {
  white-space: pre-line;
}

.register {
  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;
}

.register-card {
  width: 100%;
  max-width: 400px;
}
</style>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import type { VForm } from 'vuetify/components';
import { router } from '@/router';
import { routeProps } from '@/router/RouteProps';
import type { FormItems } from '../models/interfaces/FormItems.interface';

const usernameRules = [
  (v: string) =>
    (!!v && v.length >= 4) ||
    "O nome de usuário precisa ter pelo menos 4 caracteres."
]

const nameRules = [
  (v: string) =>
    (!!v && v.length >= 4) ||
    "O nome precisa ter pelo menos 4 caracteres."
]


const passwordRules = [
  (v: string) =>
    (!!v && v.length >= 8) ||
    "A senha precisa ter pelo menos 8 caracteres."
]

const birthDateRules = [
  (v: string) =>
    (!!v && v.length >= 8) ||
    "A senha precisa ter pelo menos 8 caracteres."
]

const defaultInputProps = {
  class: "mb-2",
  variant: "outlined",
  density: "compact",
  required: true
} as const



const authSore = useAuthStore()

const username = ref("")
const name = ref("")
const birthDate = ref("")
const password = ref("")
const registerError = ref<string | undefined>(undefined)
const passwordErrorMessage = ref<string | undefined>(undefined)
const usernameErrorMessage = ref<string | undefined>(undefined)
const nameErrorMessage = ref<string | undefined>(undefined)
const birthDateErrorMessage = ref<string | undefined>(undefined)

const form = ref<VForm | null>(null)
const isValid = ref(false)

  const formItems: FormItems[] = [
  {
    label: "Nome completo",
    rules: nameRules,
    model: name,
    errorMessage: nameErrorMessage,
    type: "text"
  }, 

  {
    label: "Data de nascimento",
    rules: birthDateRules,
    model: birthDate,
    errorMessage: birthDateErrorMessage,
    type: "text"
  },

  {
    label: "Nome de usuário",
    rules: usernameRules,
    model: username,
    errorMessage: usernameErrorMessage,
    type: "text"
  },

  {
    label: "Senha",
    rules: passwordRules,
    model: password,
    errorMessage: passwordErrorMessage,
    type: "password"

  }
]

const handleRegister = async () => {

  if (!form.value) return

  usernameErrorMessage.value = ""

  passwordErrorMessage.value = ""

  nameErrorMessage.value = ""

  birthDateErrorMessage.value = ""

  registerError.value = undefined


  const result = await form.value.validate()

  if (result.valid) {
    const response = await authSore.login(username.value, password.value)

    if (!response) {
      console.log(authSore.token)
      console.log(authSore.isAuthenticated)
      console.log(authSore.expiresAt)
      return
    }

    if (response.state === 'error') {
      console.log(response.data)
      response.data.forEach(item => {
        if (item.field) {
          if (item.field === "password") {
            passwordErrorMessage.value = item.message
          } else {
            usernameErrorMessage.value = item.message
          }
        }
      })

      registerError.value = response.data.find(item => !item.field)?.message
      await nextTick()
      await form.value.validate()
    }
  }
}

const handleBack = () => {
  router.push({
    name: routeProps.login.name
  })
}

watch(password, () => {
  passwordErrorMessage.value = ""
  registerError.value = undefined
})

watch(username, () => {
  usernameErrorMessage.value = ""
  registerError.value = undefined
})

watch(name, () => {
  nameErrorMessage.value = ""
  registerError.value = undefined
})

watch(birthDate, () => {
  birthDateErrorMessage.value = ""
  registerError.value = undefined
})

</script>