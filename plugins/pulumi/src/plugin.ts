import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const pulumiPlugin = createPlugin({
  id: 'pulumi',
  routes: {
    root: rootRouteRef,
  },
});

export const PulumiPage = pulumiPlugin.provide(
  createRoutableExtension({
    name: 'PulumiPage',
    component: () =>
      import('./components/PulumiGcpComponent').then(m => m.PulumiGcpComponent),
    mountPoint: rootRouteRef,
  }),
);
