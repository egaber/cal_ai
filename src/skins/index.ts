/**
 * Skin System Entry Point
 * Exports all skins and utilities for the theming system
 */

import { lightSkin } from './lightSkin';
import { darkSkin } from './darkSkin';
import { darkBlueSkin } from './darkBlueSkin';

export { lightSkin } from './lightSkin';
export { darkSkin } from './darkSkin';
export { darkBlueSkin } from './darkBlueSkin';
export type { Skin, ThemeMode } from './types';

// Available skins
export const skins = {
  light: lightSkin,
  dark: darkSkin,
  darkBlue: darkBlueSkin,
} as const;

export type SkinName = keyof typeof skins;
