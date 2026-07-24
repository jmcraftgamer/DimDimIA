import { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ children, size = 22, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" width={size} height={size} {...props}>
      {children}
    </svg>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m4-8v8m5-4v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4" />
    </Icon>
  )
}

export function ChatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </Icon>
  )
}

export function StoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" />
      <path d="M21 7l-1 14H4L3 7" />
    </Icon>
  )
}

export function MonitorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 17V9m-4 8V5m8 12V3M3 21h18" />
    </Icon>
  )
}

export function StatusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 21h18" />
      <path d="M6 18V9m4 9V6m4 12v-6m4 6V3" />
    </Icon>
  )
}

export function LoginIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </Icon>
  )
}

export function EletrodomesticosIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <circle cx="12" cy="18" r="1" />
      <path d="M8 6h8" />
    </Icon>
  )
}

export function EletronicosIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </Icon>
  )
}

export function CelularesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <circle cx="12" cy="18" r="1" />
    </Icon>
  )
}

export function FonesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12a9 9 0 1118 0" />
      <path d="M21 12v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4" />
      <path d="M9 16a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    </Icon>
  )
}

export function InformaticaIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      <rect x="2" y="4" width="20" height="16" rx="2" />
    </Icon>
  )
}

export function GamesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <circle cx="8" cy="12" r="1" />
      <circle cx="16" cy="12" r="1" />
      <path d="M10 12h4" />
    </Icon>
  )
}

export function CasaIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </Icon>
  )
}

export function ModaIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 2l3 3h6l3-3" />
      <path d="M6 2v18a2 2 0 002 2h8a2 2 0 002-2V2" />
    </Icon>
  )
}

export function BelezaIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M12 12v10" />
      <path d="M8 18l4 2 4-2" />
    </Icon>
  )
}

export function EsportesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93l14.14 14.14" />
      <path d="M2 12h20" />
    </Icon>
  )
}

export function AutomotivoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 17h14M5 17a2 2 0 01-2-2v-4l2.5-5A2 2 0 017.5 5h9a2 2 0 011.5.5L21 11v4a2 2 0 01-2 2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </Icon>
  )
}

export function LivrosIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </Icon>
  )
}

export function FerramentasIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </Icon>
  )
}

export function PetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 16c-2 0-4 1-4 3v1h8v-1c0-2-2-3-4-3z" />
      <circle cx="6" cy="6" r="2" />
      <circle cx="14" cy="6" r="2" />
      <circle cx="2" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </Icon>
  )
}

export function BebeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="10" r="6" />
      <path d="M12 2v2" />
      <path d="M8 14l-2 6h12l-2-6" />
    </Icon>
  )
}

export function AudioIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="12" y1="9" x2="12" y2="15" />
    </Icon>
  )
}

export const CATEGORY_ICONS: Record<string, (props: IconProps) => React.ReactNode> = {
  eletrodomesticos: EletrodomesticosIcon,
  eletronicos: EletronicosIcon,
  celulares: CelularesIcon,
  fones: FonesIcon,
  informatica: InformaticaIcon,
  games: GamesIcon,
  casa: CasaIcon,
  moda: ModaIcon,
  beleza: BelezaIcon,
  esportes: EsportesIcon,
  automotivo: AutomotivoIcon,
  livros: LivrosIcon,
  ferramentas: FerramentasIcon,
  pet: PetIcon,
  bebe: BebeIcon,
  audio: AudioIcon,
}

export function homeIcon(s: number = 22) { return HomeIcon }
export function chatIcon(s: number = 22) { return ChatIcon }
export function storeIcon(s: number = 22) { return StoreIcon }
