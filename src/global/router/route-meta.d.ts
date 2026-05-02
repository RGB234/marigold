import "vue-router";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresRecentAuth?: boolean;
    roles?: string[];
  }
}

export {};
