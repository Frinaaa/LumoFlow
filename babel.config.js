module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { 
        electron: '31.0.0',
        browsers: ['last 2 Chrome versions']
      } 
    }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: [],
};

