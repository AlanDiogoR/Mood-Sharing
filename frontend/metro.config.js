// Metro config para Expo
// Usa require aqui porque é executado no Node.js, não no runtime do Expo
const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
