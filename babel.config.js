module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: process.env.NODE_ENV === 'test'
          ? { node: 'current' } // Target Node.js when running Jest tests
          : { electron: '31.0.0' }, // Target Electron for the actual app
      },
    ],
    ['@babel/preset-react', { runtime: 'automatic' }],
    [
      '@babel/preset-typescript',
      {
        isTSX: true, // Forces TS compiler to handle JSX in .tsx files correctly
        allExtensions: true,
      },
    ],
  ],
  plugins: [],
};