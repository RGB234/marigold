import { ref } from "vue";
import { defineStore } from "pinia";
import type { TSID_String } from "@/global/types/common";
import {
  getCurrentUserProfile,
  updateCurrentUserProfile,
} from "@/user/api/user.api";
import type { UserInfoDto } from "@/user/types/user";

export type CurrentUserPhase = "idle" | "loading" | "ready" | "updating" | "error";

export const useUserStore = defineStore("user", () => {
  const ownerId = ref<TSID_String | null>(null);
  const profile = ref<UserInfoDto | null>(null);
  const phase = ref<CurrentUserPhase>("idle");

  let requestGeneration = 0;
  let loadPromise: Promise<void> | null = null;
  let loadingOwnerId: TSID_String | null = null;

  function clearCurrentUser(): void {
    requestGeneration += 1;
    loadPromise = null;
    loadingOwnerId = null;
    ownerId.value = null;
    profile.value = null;
    phase.value = "idle";
  }

  async function loadCurrentUser(expectedUserId: TSID_String): Promise<void> {
    if (loadPromise && loadingOwnerId === expectedUserId) {
      return loadPromise;
    }
    if (phase.value === "ready" && ownerId.value === expectedUserId) {
      return;
    }

    const generation = ++requestGeneration;
    ownerId.value = expectedUserId;
    profile.value = null;
    phase.value = "loading";
    loadingOwnerId = expectedUserId;

    const pending = (async () => {
      try {
        const nextProfile = await getCurrentUserProfile();
        if (generation !== requestGeneration || ownerId.value !== expectedUserId) {
          return;
        }
        if (nextProfile.id !== expectedUserId) {
          throw new Error("Current user profile does not match the authenticated session");
        }
        profile.value = nextProfile;
        phase.value = "ready";
      } catch (error) {
        if (generation === requestGeneration && ownerId.value === expectedUserId) {
          profile.value = null;
          phase.value = "error";
        }
        throw error;
      } finally {
        if (generation === requestGeneration) {
          loadPromise = null;
          loadingOwnerId = null;
        }
      }
    })();

    loadPromise = pending;
    return pending;
  }

  async function updateCurrentUser(formData: FormData): Promise<void> {
    const expectedUserId = ownerId.value;
    if (!expectedUserId) {
      throw new Error("Cannot update a profile without an authenticated user");
    }

    const generation = requestGeneration;
    phase.value = "updating";
    try {
      const updatedProfile = await updateCurrentUserProfile(formData);
      if (generation !== requestGeneration || ownerId.value !== expectedUserId) {
        return;
      }
      if (updatedProfile.id !== expectedUserId) {
        throw new Error("Updated profile does not match the authenticated session");
      }
      profile.value = updatedProfile;
      phase.value = "ready";
    } catch (error) {
      if (generation === requestGeneration && ownerId.value === expectedUserId) {
        phase.value = profile.value ? "ready" : "error";
      }
      throw error;
    }
  }

  return {
    ownerId,
    profile,
    phase,
    loadCurrentUser,
    updateCurrentUser,
    clearCurrentUser,
  };
});
