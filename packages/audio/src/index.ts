/**
 * @shikaku/audio
 *
 * Platform-agnostic sound system: the sound-effect catalog (PRD §8), the four
 * independent volume channels, dynamic music staging tied to puzzle completion,
 * and a SoundManager that drives a pluggable AudioBackend. The web app supplies
 * a Web Audio backend; mobile an expo-av backend.
 */

export * from './events.js';
export * from './channels.js';
export * from './dynamic.js';
export { SoundManager, type AudioBackend } from './manager.js';
