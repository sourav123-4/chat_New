declare global {
  var info: Record<string, any>; // Add the `info` property globally
}

export {};

/* 
Using -->> 

// src/App.tsx
global.info = {};
global.info['appName'] = 'React Native App';

console.log(global.info['appName']); // Outputs: React Native App
*/
