<script setup lang="ts">
import { GrundtoneThemeProvider } from "@grundtone/vue";
import AppShell from "./components/AppShell.vue";
</script>

<template>
  <GrundtoneThemeProvider mode="auto" persist-mode>
    <AppShell />
  </GrundtoneThemeProvider>
</template>
