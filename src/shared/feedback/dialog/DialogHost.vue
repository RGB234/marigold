<template>
  <v-dialog v-model="store.current.show" max-width="400" persistent>
    <v-card>
      <v-card-title v-if="store.current.title" class="text-h6 font-weight-bold">
        {{ store.current.title }}
      </v-card-title>

      <v-card-text class="pt-2">
        {{ store.current.text }}
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="store.current.type === 'confirm'"
          color="grey-darken-1"
          variant="text"
          @click="store.close(false)"
        >
          취소
        </v-btn>
        <v-btn color="primary" variant="text" @click="store.close(true)">
          확인
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useDialogStore } from "@/shared/feedback/dialog/dialog.store";

const store = useDialogStore();
</script>
