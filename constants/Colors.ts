/**
 * Snacc App Colors - Integrated with Design System
 * Maintains compatibility with existing Expo structure while using our warm, modern palette
 */

import { LightColors, DarkColors } from './Design'

const tintColorLight = LightColors.primary
const tintColorDark = DarkColors.primary

export const Colors = {
  light: {
    text: LightColors.text,
    background: LightColors.background,
    tint: tintColorLight,
    icon: LightColors.textSecondary,
    tabIconDefault: LightColors.textTertiary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: DarkColors.text,
    background: DarkColors.background,
    tint: tintColorDark,
    icon: DarkColors.textSecondary,
    tabIconDefault: DarkColors.textTertiary,
    tabIconSelected: tintColorDark,
  },
}

// Re-export our design system colors for easy access
export { LightColors, DarkColors, BaseColors } from './Design'