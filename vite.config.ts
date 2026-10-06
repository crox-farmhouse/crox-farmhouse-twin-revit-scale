import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
          if (id.includes('node_modules/preact') || id.includes('node_modules/@preact')) {
            return 'vendor-preact';
          }
          if (id.includes('/src/engine/') || id.includes('/src/knx/') || id.includes('/src/core/')) {
            return 'engine-and-knx';
          }
          if (id.includes('/src/ui/') || id.includes('/src/state/')) {
            return 'ui-hud';
          }
          if (id.includes('/src/objects/vehicles/')) {
            return 'objects-vehicles';
          }
          if (id.includes('/src/objects/')) {
            return 'objects-catalog';
          }
          if (
            id.includes('/src/homes/crox-farmhouse/rooms/grounds/outbuildings') ||
            id.includes('/src/homes/crox-farmhouse/rooms/grounds/outbuilding-shell') ||
            id.includes('/src/homes/crox-farmhouse/rooms/grounds/mezzanine')
          ) {
            return 'crox-outbuildings';
          }
          if (id.includes('/src/homes/crox-farmhouse/rooms/ground/')) {
            return 'crox-ground-floor';
          }
          if (
            id.includes('/src/homes/crox-farmhouse/rooms/first/') ||
            id.includes('/src/homes/crox-farmhouse/structure/') ||
            id.includes('/src/homes/crox-farmhouse/heating/')
          ) {
            return 'crox-upper-and-structure';
          }
          return undefined;
        },
      },
    },
  },
});
