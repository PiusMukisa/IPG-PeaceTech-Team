import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
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
        testimonials: resolve(import.meta.dirname, 'testimonials.html'),
        intervention: resolve(import.meta.dirname, 'intervention.html'),
        popUps: resolve(import.meta.dirname, 'pop-ups.html'),
        diploma: resolve(import.meta.dirname, 'diploma.html'),
        artTherapy: resolve(import.meta.dirname, 'art-therapy.html'),
        aprilIntensive: resolve(import.meta.dirname, 'april-intensive.html'),
        programDescription: resolve(import.meta.dirname, 'program-description.html'),
        healingArtsYoga: resolve(import.meta.dirname, 'healing-arts-yoga.html'),
        classes: resolve(import.meta.dirname, 'classes.html'),
        registration: resolve(import.meta.dirname, 'registration.html'),
        payment: resolve(import.meta.dirname, 'payment.html')
      }
    }
  }
});
