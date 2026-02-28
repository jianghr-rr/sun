export type ThemeId = 'neutral' | 'green' | 'warm' | 'blue'

export type FontId = 'noto-serif' | 'lxgw-wenkai' | 'noto-sans'

export type FontSizeId = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type ReadingWidthId = 'narrow' | 'standard' | 'wide' | 'extrawide'

export interface FontOption {
  id: FontId
  label: string
  category: string
}

export interface FontSizeOption {
  id: FontSizeId
  label: string
}

export interface ReadingWidthOption {
  id: ReadingWidthId
  label: string
}

export interface AppearanceState {
  theme: ThemeId
  font: FontId
  fontSize: FontSizeId
  readingWidth: ReadingWidthId
}

export const THEMES: { id: ThemeId; label: string; light?: boolean }[] = [
  { id: 'neutral', label: '冷灰学术' },
  { id: 'green', label: '墨绿书卷' },
  { id: 'warm', label: '暖白书页', light: true },
  { id: 'blue', label: '天青素雅', light: true },
]

export const FONTS: FontOption[] = [
  { id: 'noto-serif', label: '思源宋体', category: '衬线' },
  { id: 'lxgw-wenkai', label: '霞鹜文楷', category: '楷体' },
  { id: 'noto-sans', label: '思源黑体', category: '无衬线' },
]

export const FONT_SIZES: FontSizeOption[] = [
  { id: 'xs', label: '较小' },
  { id: 'sm', label: '小' },
  { id: 'md', label: '标准' },
  { id: 'lg', label: '大' },
  { id: 'xl', label: '较大' },
]

export const READING_WIDTHS: ReadingWidthOption[] = [
  { id: 'narrow', label: '窄' },
  { id: 'standard', label: '标准' },
  { id: 'wide', label: '宽' },
  { id: 'extrawide', label: '较宽' },
]

export const APPEARANCE_DEFAULTS: AppearanceState = {
  theme: 'neutral',
  font: 'noto-serif',
  fontSize: 'md',
  readingWidth: 'standard',
}
