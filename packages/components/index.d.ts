export interface ButtonProps { variant?: 'primary' | 'secondary' | 'quiet'; disabled?: boolean; onClick?: () => void; children: React.ReactNode }
export interface LinkProps { href: string; children: React.ReactNode }
export interface AlertProps { kind?: 'info' | 'success' | 'warning' | 'danger'; title?: string; children: React.ReactNode }
export interface ProseProps { serif?: boolean; style?: React.CSSProperties; children: React.ReactNode }
export interface ReaderProps { initial?: { theme?: 'light' | 'sepia' | 'dark' | 'dim' | 'hc-light' | 'hc-dark'; font?: 'inter' | 'atkinson' | 'serif' | 'mono'; sizePx?: number; lineHeight?: number; letterSpacingEm?: number } }
export declare function guard(p: Record<string, unknown>): Record<string, unknown>;
export interface HeadingProps { level?: 1 | 2 | 3 | 4; children: React.ReactNode }
export interface InputProps { label: string; hint?: string; error?: string; id?: string; type?: string; value?: string; onChange?: (e: unknown) => void }
export interface CardProps { title?: string; children: React.ReactNode }
export interface TableProps { columns: string[]; rows: (string | number)[][]; numeric?: number[]; caption?: string }
export interface GroupProps { label?: string; children: React.ReactNode }
export interface SummaryProps { answer: React.ReactNode; points?: React.ReactNode[]; action?: React.ReactNode; label?: string }
export interface CompareProps { options: string[]; criteria: string[]; values: (string | number | null | undefined)[][]; pick?: number; pickLabel?: string; numeric?: number[]; caption?: string }
