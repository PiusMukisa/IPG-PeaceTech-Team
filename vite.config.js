import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about.html'),
        work: resolve(import.meta.dirname, 'work.html'),
        approach: resolve(import.meta.dirname, 'approach.html'),
        stories: resolve(import.meta.dirname, 'stories.html'),
        contact: resolve(import.meta.dirname, 'contact.html'),
        healingHistory: resolve(import.meta.dirname, 'healing-history.html'),
        magarini: resolve(import.meta.dirname, 'magarini.html'),
        trainings: resolve(import.meta.dirname, 'trainings.html'),
        rwcClinic: resolve(import.meta.dirname, 'rwc-clinic.html'),
        events: resolve(import.meta.dirname, 'events.html'),
        testimonials: resolve(import.meta.dirname, 'testimonials.html')
      }
    }
  }
});
