// Polyfill TextEncoder/TextDecoder for Jest
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, {
  TextEncoder,
  TextDecoder,
});
