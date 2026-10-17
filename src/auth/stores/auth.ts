import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  getAuthStatus,
  loginWithPassword,
  refreshAuthSession,
  requestLogout,
} from "@/auth/api/auth.api";
import type {
  AuthSession,
  AuthState,
  PasswordLoginRequest,
} from "@/auth/types/auth";
import { clearPendingAuthState } from "@/auth/utils/pendingAuth";
import { clearSecurityAccess } from "@/auth/utils/securityAccess";
import { clearCsrfToken } from "@/shared/http/client";
import { RefreshCoordinator } from "@/auth/services/refreshCoordinator";
import { normalizeApiError } from "@/shared/errors/apiError";
import { validateTsid } from "@/shared/validation/validators";

function isValidSession(session: unknown): session is AuthSession {
  if (!session || typeof session !== "object") {
    return false;
  }

  const candidate = session as Partial<AuthSession>;
  if (!candidate.principal) {
    return false;
  }

  return (
    typeof candidate.accessToken === "string" &&
    candidate.accessToken.length > 0 &&
    validateTsid(candidate.principal.userId) &&
    Array.isArray(candidate.principal.authorities) &&
    candidate.principal.authorities.every((authority) => typeof authority === "string")
  );
}

export const useAuthStore = defineStore("auth", () => {
  const state = ref<AuthState>({ phase: "uninitialized", session: null });

  let initializationPromise: Promise<void> | null = null;
  const refreshCoordinator = new RefreshCoordinator<string | null>();
  let sessionGeneration = 0;
  let committedGeneration = -1;

  const phase = computed(() => state.value.phase);
  const isAuthenticated = computed(() => state.value.phase === "authenticated");
  const accessToken = computed(() =>
    state.value.phase === "authenticated" ? state.value.session.accessToken : null,
  );
  const userId = computed(() =>
    state.value.phase === "authenticated" ? state.value.session.principal.userId : null,
  );
  const authorities = computed(() =>
    state.value.phase === "authenticated"
      ? state.value.session.principal.authorities
      : [],
  );

  function establishSession(session: AuthSession): void {
    if (!isValidSession(session)) {
      throw new Error("Invalid authentication session response");
    }

    state.value = {
      phase: "authenticated",
      session: {
        accessToken: session.accessToken,
        principal: {
          userId: session.principal.userId,
          authorities: [...session.principal.authorities],
        },
      },
    };
    committedGeneration = sessionGeneration;
  }

  function invalidateSession(): void {
    sessionGeneration += 1;
    committedGeneration = sessionGeneration;
    state.value = { phase: "anonymous", session: null };
    clearPendingAuthState();
    clearSecurityAccess();
  }

  async function refreshAccessToken(): Promise<string | null> {
    const generation = sessionGeneration;
    return refreshCoordinator.run(async () => {
      try {
        const session = await refreshAuthSession();
        if (generation !== sessionGeneration) {
          return committedGeneration === sessionGeneration ? accessToken.value : null;
        }
        establishSession(session);
        return session.accessToken;
      } catch (error) {
        if (generation !== sessionGeneration) {
          return committedGeneration === sessionGeneration ? accessToken.value : null;
        }
        const normalized = normalizeApiError(error);
        if (normalized.type === "api" && normalized.status === 401) {
          invalidateSession();
          return null;
        }
        throw error;
      }
    });
  }

  async function restoreSession(): Promise<void> {
    if (initializationPromise) {
      return initializationPromise;
    }

    const previousState = state.value;
    const generation = sessionGeneration;
    if (previousState.phase !== "authenticated") {
      state.value = { phase: "restoring", session: null };
    }

    initializationPromise = (async () => {
      try {
        const status = await getAuthStatus();
        if (generation !== sessionGeneration) {
          return;
        }
        if (!status.refreshTokenPresent) {
          invalidateSession();
          return;
        }

        await refreshAccessToken();
      } catch (error) {
        if (generation !== sessionGeneration) {
          return;
        }
        if (previousState.phase === "authenticated") {
          state.value = previousState;
        } else if (state.value.phase !== "anonymous") {
          state.value = { phase: "unavailable", session: null };
        }
        throw error;
      }
    })().finally(() => {
      initializationPromise = null;
    });

    return initializationPromise;
  }

  async function ensureInitialized(): Promise<void> {
    if (state.value.phase === "anonymous" || state.value.phase === "authenticated") {
      return;
    }
    return restoreSession();
  }

  async function signInWithPassword(credentials: PasswordLoginRequest): Promise<void> {
    const generation = ++sessionGeneration;
    const session = await loginWithPassword(credentials);
    if (generation === sessionGeneration) {
      establishSession(session);
    }
  }

  async function signOut(): Promise<void> {
    invalidateSession();
    try {
      await requestLogout();
      clearCsrfToken();
    } catch {
      // A server-side failure must not keep the local session alive.
    }
  }

  function hasAnyAuthority(requiredAuthorities: string[]): boolean {
    return requiredAuthorities.some((authority) => authorities.value.includes(authority));
  }

  return {
    state,
    phase,
    isAuthenticated,
    accessToken,
    userId,
    authorities,
    ensureInitialized,
    restoreSession,
    signInWithPassword,
    refreshAccessToken,
    signOut,
    hasAnyAuthority,
  };
});
