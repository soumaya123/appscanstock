const { contextBridge } = require('electron');

// Exposer des APIs sécurisées au renderer si besoin
contextBridge.exposeInMainWorld('api', {
  // Placeholder: ajouter des méthodes si nécessaire plus tard
  version: () => '1.0.0',
});