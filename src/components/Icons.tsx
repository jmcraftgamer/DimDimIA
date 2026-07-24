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
      <path d="M3 10.5V20a1 1 0 001 1h5v-6h6v6h5a1 1 0 001-1v-9.5" />
      <path d="M2 10l10-8 10 8" />
      <path d="M7 3v2l3-2.5" />
    </Icon>
  )
}

export function ChatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12a9 9 0 01-9 9c-1.5 0-2.9-.35-4.15-.95L3 21l1.95-4.85A8.97 8.97 0 013 12a9 9 0 019-9 9 9 0 019 9z" />
      <circle cx="9" cy="12" r=".5" fill="currentColor" />
      <circle cx="12" cy="12" r=".5" fill="currentColor" />
      <circle cx="15" cy="12" r=".5" fill="currentColor" />
    </Icon>
  )
}

export function StoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 4h3l1 3h14l-2 10H6L4 7" />
      <circle cx="7" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
      <path d="M9 4l1 3" />
      <path d="M15 4l-1 3" />
    </Icon>
  )
}

export function MonitorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M3 18h18" />
      <path d="M8 22h8" />
      <path d="M12 18v4" />
      <path d="M7 8l3 4-3 4" />
      <path d="M17 8l-3 4 3 4" />
    </Icon>
  )
}

export function StatusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V14" />
      <path d="M9 21V10" />
      <path d="M13 21V6" />
      <path d="M17 21V3" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="8" r="1" fill="currentColor" />
      <circle cx="13" cy="4" r="1" fill="currentColor" />
      <circle cx="17" cy="1" r="1" fill="currentColor" />
    </Icon>
  )
}

export function LoginIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 4h5a2 2 0 012 2v12a2 2 0 01-2 2h-5" />
      <path d="M9 8l-4 4 4 4" />
      <path d="M5 12h10" />
      <path d="M16 2v20" strokeOpacity={0.2} />
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


