// Route Handlers will be exported here
// These are Next.js Route Handlers that can be mounted by the host app

// Export factory pattern (recommended)
export { createAIEditorRoutes, defaultRoutes } from './factory';
export type { RouteFactoryConfig } from './factory';

// Export individual handlers for direct mounting (legacy)
export { POST as generate } from './generate-route';
export { GET as jobStatus } from './job-status-route';

