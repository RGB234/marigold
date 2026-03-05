<template>
  <div>
    <!-- Dialog (Alert / Confirm) -->
    <v-dialog v-model="store.dialog.show" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 font-weight-bold" v-if="store.dialog.title">
          {{ store.dialog.title }}
        </v-card-title>
        
        <v-card-text class="pt-2">
          {{ store.dialog.text }}
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          
          <!-- 취소 버튼 (Confirm 타입일 때만 표시) -->
          <v-btn
            v-if="store.dialog.type === 'confirm'"
            color="grey-darken-1"
            variant="text"
            @click="store.handleDialogAction(false)"
          >
            취소
          </v-btn>

          <!-- 확인 버튼 -->
          <v-btn
            color="primary"
            variant="text"
            @click="store.handleDialogAction(true)"
          >
            확인
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar (Toast) -->
    <v-snackbar
      v-model="store.snackbar.show"
      :color="store.snackbar.color"
      :timeout="store.snackbar.timeout"
      location="top middle"
      rounded="pill"
    >
      {{ store.snackbar.text }}
      
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          icon="mdi-close"
          size="small"
          @click="store.snackbar.show = false"
        ></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { useAlertStore } from '@/global/stores/alert';

const store = useAlertStore();
</script>
