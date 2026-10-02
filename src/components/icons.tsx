// Minimal stroke icon set (Lucide-style, 24×24). Zero-dependency —
// avoids version risk from the declared lucide-react package.
import type { CSSProperties, ReactNode } from 'react';

interface IconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

function Svg({ size = 20, className, style, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ic = (paths: ReactNode) => {
  const C = (p: IconProps) => <Svg {...p}>{paths}</Svg>;
  return C;
};

export const SaladIcon = ic(<><path d="M4 12h16" /><path d="M6 12a6 6 0 0 0 12 0" /><path d="M12 12c0-3.5 2.5-6 6-6-.5 3.5-2.5 6-6 6Z" /><path d="M9 21h6" /></>);
export const CalculatorIcon = ic(<><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8" /><path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" /></>);
export const MapPinIcon = ic(<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>);
export const SparklesIcon = ic(<><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /><path d="M19 3l.7 1.8L21.5 5.5l-1.8.7L19 8l-.7-1.8-1.8-.7 1.8-.7Z" /></>);
export const BotIcon = ic(<><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M12 8V4M8 4h8" /><circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" /><path d="M9 17h6" /></>);
export const BarChartIcon = ic(<><path d="M3 3v18h18" /><path d="M7 15v3M12 10v8M17 6v12" /></>);
export const TargetIcon = ic(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>);
export const PillIcon = ic(<><path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z" /><path d="M7 10.5l7 7" /></>);
export const FlameIcon = ic(<><path d="M12 22c4.4 0 8-3.6 8-8 0-4-3-7-5-9-1 2-3 3-3 6-1.5-1-2-2.5-2-4.5C7.5 8 4 11 4 14c0 4.4 3.6 8 8 8Z" /></>);
export const DumbbellIcon = ic(<><path d="M6.5 6.5v11M17.5 6.5v11" /><path d="M3.5 9v6M20.5 9v6" /><path d="M6.5 12h11" /></>);
export const ScaleIcon = ic(<><path d="M12 3v18" /><path d="M5 7h14" /><path d="M5 7l-2.5 6a3 3 0 0 0 6 0L6 7" /><path d="M19 7l-2.5 6a3 3 0 0 0 6 0L20 7" /><path d="M8 21h8" /></>);
export const LeafIcon = ic(<><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" /><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12" /></>);
export const TrophyIcon = ic(<><path d="M8 21h8M12 17v4" /><path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4a1 1 0 0 0-1 1c0 2.5 2 4 4 4M17 6h3a1 1 0 0 1 1 1c0 2.5-2 4-4 4" /></>);
export const DropletsIcon = ic(<><path d="M12 2.7 17.7 8.4a8 8 0 1 1-11.4 0Z" /><path d="M9.5 13.5a2.5 2.5 0 0 0 2.5 2.5" /></>);
export const ActivityIcon = ic(<><path d="M22 12h-4l-3 8-6-16-3 8H2" /></>);
export const HeartIcon = ic(<><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" /></>);
export const UserIcon = ic(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></>);
export const GlobeIcon = ic(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" /></>);
export const RefreshIcon = ic(<><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></>);
export const MailIcon = ic(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>);
export const LockIcon = ic(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>);
export const ArrowRightIcon = ic(<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>);
export const ArrowLeftIcon = ic(<><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>);
export const XIcon = ic(<><path d="M18 6 6 18M6 6l12 12" /></>);
export const CheckIcon = ic(<><path d="M20 6 9 17l-5-5" /></>);
export const CheckCircleIcon = ic(<><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 5-5" /></>);
export const ChevronDownIcon = ic(<><path d="m6 9 6 6 6-6" /></>);
export const SendIcon = ic(<><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>);
export const ChatIcon = ic(<><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></>);
export const LogoutIcon = ic(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>);
export const CoffeeIcon = ic(<><path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><path d="M7 2v2M11 2v2M15 2v2" /></>);
export const AppleIcon = ic(<><path d="M12 20.5c-4.5-2-7-5.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 21 10.5c0 4.5-2.5 8-7 10l-2-.5Z" /><path d="M12 7.5c0-2 1-3.5 3-4.5" /></>);
export const SunIcon = ic(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
export const MoonIcon = ic(<><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></>);
export const CookieIcon = ic(<><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5Z" /><path d="M8.5 8.5h.01M12 12h.01M15.5 9.5h.01M11 16h.01" /></>);
export const ClockIcon = ic(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const BulbIcon = ic(<><path d="M9 18h6M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2Z" /></>);
export const SmileIcon = ic(<><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01M15 9h.01" /></>);
export const MehIcon = ic(<><circle cx="12" cy="12" r="9" /><path d="M8 15h8" /><path d="M9 9h.01M15 9h.01" /></>);
export const FrownIcon = ic(<><circle cx="12" cy="12" r="9" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><path d="M9 9h.01M15 9h.01" /></>);
export const LaughIcon = ic(<><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2.5 4 2.5S16 14 16 14" /><path d="M9 9h.01M15 9h.01" /><path d="M7 5.5 5.5 4M17 5.5 18.5 4" /></>);
export const CartIcon = ic(<><circle cx="9" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" /><path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L21 7H6" /></>);
export const UtensilsIcon = ic(<><path d="M4 2v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2" /><path d="M6 13v8" /><path d="M20 2c-2 2-3 5-3 8v3h3v9" /><path d="M20 2v9" /></>);
export const BedIcon = ic(<><path d="M2 5v14" /><path d="M2 12h20v7" /><path d="M2 16h20" /><path d="M6 12V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" /></>);
export const ZapIcon = ic(<><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /></>);
export const InfoIcon = ic(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>);
export const AlertIcon = ic(<><path d="M12 3 2 20h20Z" /><path d="M12 10v4" /><path d="M12 17.5h.01" /></>);
export const BrainIcon = ic(<><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.2 1.8A3.5 3.5 0 0 1 3 18.5v-9a3.5 3.5 0 0 1 2-3.2A2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.2 1.8 3.5 3.5 0 0 0 4.8-3.3v-9a3.5 3.5 0 0 0-2-3.2A2.5 2.5 0 0 0 14.5 2Z" /></>);
export const TrendUpIcon = ic(<><path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></>);
export const WheatIcon = ic(<><path d="M12 22V8" /><path d="M12 8C12 4 9 2 5 2c0 4 3 6 7 6Z" /><path d="M12 8c0-4 3-6 7-6 0 4-3 6-7 6Z" /><path d="M12 14c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 14c3 0 5-2 5-5-3 0-5 2-5 5Z" /></>);
export const PlusIcon = ic(<><path d="M12 5v14M5 12h14" /></>);
export const GlassWaterIcon = ic(<><path d="M6 3h12l-1.5 18h-9Z" /><path d="M6 8h12" /></>);
export const ClipboardIcon = ic(<><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></>);
export const TrashIcon = ic(<><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></>);
export const DashboardIcon = ic(<><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>);
