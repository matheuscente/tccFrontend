<template>
  <v-app>
    <v-main class="login">
      <v-card class="login-card pa-6" elevation="4">
        <v-card-title class="text-h5 text-center">
          Entrar
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="isValid" @submit.prevent="handleLogin">

            <v-text-field v-for="item in formItems" v-bind="defaultInputProps" :v-model="item.model" :error-messages="item.errorMessage.value" :rules="item.rules" :type="item.type" :label="item.label"/>

            <v-alert v-if="loginError" type="error" variant="tonal" class="mb-5 multi-line-alert">
              {{ loginError }}
            </v-alert>

            <v-btn block color="primary" size="large" type="submit" :disabled="!isValid">
              Entrar
            </v-btn>
          </v-form>


          <v-btn block color="secondary" size="large" class="mt-5" @click="handleRegister">
            Cadastrar
          </v-btn>
        </v-card-text>
      </v-card>
    </v-main>
  </v-app>
</template>

<style scoped>
.multi-line-alert {
  white-space: pre-line;
}

.login {
  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 400px;
}
</style>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import type { VForm } from 'vuetify/components';
import { router } from '@/router';
import { routeProps } from '@/router/RouteProps';
import type { FormItems } from '@/modules/user/models/interfaces/FormItems.interface';

const usernameRules = [
  (v: string) =>
    (!!v && v.length >= 4) ||
    "O nome de usuário precisa ter pelo menos 4 caracteres."
]

const passwordRules = [
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
const password = ref("")
const loginError = ref<string | undefined>(undefined)
const passwordErrorMessage = ref<string | undefined>(undefined)
const usernameErrorMessage = ref<string | undefined>(undefined)

const form = ref<VForm | null>(null)
const isValid = ref(false)

const formItems: FormItems[] = [
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

const handleLogin = async () => {

  if (!form.value) return

  usernameErrorMessage.value = ""

  passwordErrorMessage.value = ""

  loginError.value = undefined


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

      loginError.value = response.data.find(item => !item.field)?.message
      await nextTick()
      await form.value.validate()
    }
  }
}

const handleRegister = () => {
  router.push({name: routeProps.register.name})
}

watch(password, () => {
  passwordErrorMessage.value = ""
  loginError.value = undefined
})

watch(username, () => {
  usernameErrorMessage.value = ""
  loginError.value = undefined
})


</script>