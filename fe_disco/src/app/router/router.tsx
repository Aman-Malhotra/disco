import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";

import { WorkspaceShell } from "@/modules/workspace";

const rootRoute = createRootRoute({ component: () => <Outlet /> });

// Single-page app: one route. Conversation selection is pure state (no per-chat URL).
const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: WorkspaceShell,
});

const routeTree = rootRoute.addChildren([workspaceRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
