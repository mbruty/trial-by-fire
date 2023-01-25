import { defineConfig } from 'cypress';
import * as mongo from 'cypress-mongodb';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on) {
      console.log(mongo);
      mongo.configurePlugin(on);
    },
  },
});
