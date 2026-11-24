/* Icon set: Phosphor shapes (regular / bold / fill / duotone) behind the app's icon names.
 *
 * Screens import icons from here, never from an icon package, so the set can change in one place.
 * The shapes live in icon-defs.tsx, generated from phosphor-react-native (MIT) by
 * scripts/generate-icons.mjs - only the icons listed below are bundled.
 * Lucide-style props still work: strokeWidth >= 2.5 -> bold, a solid `fill` -> fill weight.
 * New: `weight` ('regular' | 'bold' | 'fill' | 'duotone').
 */
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { G } from 'react-native-svg';
import * as P from './icon-defs';
import type { IconDef, IconWeight, DuotoneFn } from './icon-defs';

export type { IconWeight };

export interface IconProps {
  size?: number;
  color?: string;
  weight?: IconWeight;
  /** Lucide compatibility: heavy strokes map to the bold weight. */
  strokeWidth?: number;
  /** Lucide compatibility: a solid fill colour maps to the fill weight. */
  fill?: string;
  /** Second-tone colour for the duotone weight (defaults to `color`). */
  duotoneColor?: string;
  duotoneOpacity?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export type AppIcon = React.FC<IconProps>;

function make(def: IconDef, name: string): AppIcon {
  const C: AppIcon = ({
    weight,
    strokeWidth,
    fill,
    size = 24,
    color = '#000',
    duotoneColor,
    duotoneOpacity = 0.2,
    style,
    accessibilityLabel,
  }) => {
    const solid = !!fill && fill !== 'none' && fill !== 'transparent';
    const w: IconWeight = weight ?? (solid ? 'fill' : strokeWidth && strokeWidth >= 2.5 ? 'bold' : 'regular');
    const shape = def.get(w) ?? def.get('regular');
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill={color}
        style={style}
        accessible={!!accessibilityLabel}
        accessibilityLabel={accessibilityLabel}
      >
        {w === 'duotone' && typeof shape === 'function' ? (
          React.createElement(shape as DuotoneFn, { duotoneColor: duotoneColor ?? color, duotoneOpacity })
        ) : (
          <G fill={color}>{shape as React.ReactElement}</G>
        )}
      </Svg>
    );
  };
  C.displayName = name;
  return React.memo(C);
}

export const AlertCircle = make(P.WarningCircle, 'AlertCircle');
export const AlertTriangle = make(P.Warning, 'AlertTriangle');
export const ArrowLeft = make(P.ArrowLeft, 'ArrowLeft');
export const ArrowRight = make(P.ArrowRight, 'ArrowRight');
export const Award = make(P.Medal, 'Award');
export const BadgeCheck = make(P.SealCheck, 'BadgeCheck');
export const BarChart3 = make(P.ChartBar, 'BarChart3');
export const Bell = make(P.Bell, 'Bell');
export const Bookmark = make(P.BookmarkSimple, 'Bookmark');
export const Briefcase = make(P.Briefcase, 'Briefcase');
export const Building = make(P.Building, 'Building');
export const Building2 = make(P.BuildingOffice, 'Building2');
export const Bus = make(P.Bus, 'Bus');
export const Calendar = make(P.CalendarBlank, 'Calendar');
export const CalendarClock = make(P.CalendarCheck, 'CalendarClock');
export const Camera = make(P.Camera, 'Camera');
export const Car = make(P.Car, 'Car');
export const Check = make(P.Check, 'Check');
export const CheckCheck = make(P.Checks, 'CheckCheck');
export const CheckCircle2 = make(P.CheckCircle, 'CheckCircle2');
export const ChevronDown = make(P.CaretDown, 'ChevronDown');
export const ChevronLeft = make(P.CaretLeft, 'ChevronLeft');
export const ChevronRight = make(P.CaretRight, 'ChevronRight');
export const Clock = make(P.Clock, 'Clock');
export const Copy = make(P.Copy, 'Copy');
export const ExternalLink = make(P.ArrowSquareOut, 'ExternalLink');
export const Eye = make(P.Eye, 'Eye');
export const EyeOff = make(P.EyeSlash, 'EyeOff');
export const Factory = make(P.Factory, 'Factory');
export const FileCheck2 = make(P.ClipboardText, 'FileCheck2');
export const FileText = make(P.FileText, 'FileText');
export const FileUp = make(P.FileArrowUp, 'FileUp');
export const Flag = make(P.Flag, 'Flag');
export const Fuel = make(P.GasPump, 'Fuel');
export const Gift = make(P.Gift, 'Gift');
export const Globe = make(P.Globe, 'Globe');
export const HardHat = make(P.HardHat, 'HardHat');
export const Home = make(P.House, 'Home');
export const Image = make(P.Image, 'Image');
export const Info = make(P.Info, 'Info');
export const Landmark = make(P.Bank, 'Landmark');
export const Languages = make(P.Translate, 'Languages');
export const LayoutDashboard = make(P.SquaresFour, 'LayoutDashboard');
export const LayoutGrid = make(P.GridFour, 'LayoutGrid');
export const LifeBuoy = make(P.Lifebuoy, 'LifeBuoy');
export const Lock = make(P.Lock, 'Lock');
export const LogOut = make(P.SignOut, 'LogOut');
export const Mail = make(P.Envelope, 'Mail');
export const MailCheck = make(P.EnvelopeOpen, 'MailCheck');
export const MapPin = make(P.MapPin, 'MapPin');
export const Menu = make(P.List, 'Menu');
export const MessageCircle = make(P.ChatCircle, 'MessageCircle');
export const MessageSquare = make(P.ChatText, 'MessageSquare');
export const Moon = make(P.Moon, 'Moon');
export const MoreVertical = make(P.DotsThreeVertical, 'MoreVertical');
export const PartyPopper = make(P.Confetti, 'PartyPopper');
export const PauseCircle = make(P.PauseCircle, 'PauseCircle');
export const Pencil = make(P.PencilSimple, 'Pencil');
export const Phone = make(P.Phone, 'Phone');
export const Pickaxe = make(P.Mountains, 'Pickaxe');
export const PlayCircle = make(P.PlayCircle, 'PlayCircle');
export const Plus = make(P.Plus, 'Plus');
export const PlusCircle = make(P.PlusCircle, 'PlusCircle');
export const RotateCw = make(P.ArrowClockwise, 'RotateCw');
export const ScrollText = make(P.Scroll, 'ScrollText');
export const Search = make(P.MagnifyingGlass, 'Search');
export const Send = make(P.PaperPlaneTilt, 'Send');
export const Settings = make(P.GearSix, 'Settings');
export const Share2 = make(P.ShareNetwork, 'Share2');
export const Shield = make(P.Shield, 'Shield');
export const ShieldAlert = make(P.ShieldWarning, 'ShieldAlert');
export const ShieldCheck = make(P.ShieldCheck, 'ShieldCheck');
export const Ship = make(P.Boat, 'Ship');
export const SlidersHorizontal = make(P.SlidersHorizontal, 'SlidersHorizontal');
export const Smartphone = make(P.DeviceMobile, 'Smartphone');
export const Sparkles = make(P.Sparkle, 'Sparkles');
export const Star = make(P.Star, 'Star');
export const Sun = make(P.Sun, 'Sun');
export const Timer = make(P.Timer, 'Timer');
export const Trash2 = make(P.Trash, 'Trash2');
export const Truck = make(P.Truck, 'Truck');
export const Upload = make(P.UploadSimple, 'Upload');
export const User = make(P.User, 'User');
export const UserPlus = make(P.UserPlus, 'UserPlus');
export const UserSearch = make(P.UserFocus, 'UserSearch');
export const Users = make(P.Users, 'Users');
export const UtensilsCrossed = make(P.ForkKnife, 'UtensilsCrossed');
export const WifiOff = make(P.WifiSlash, 'WifiOff');
export const X = make(P.X, 'X');
export const XCircle = make(P.XCircle, 'XCircle');
export const Banknote = make(P.Money, 'Banknote');
export const Zap = make(P.Lightning, 'Zap');
export const Wrench = make(P.Wrench, 'Wrench');
export const Cog = make(P.Gear, 'Cog');
export const Flame = make(P.Fire, 'Flame');
export const Crane = make(P.Crane, 'Crane');
export const HandHelping = make(P.HandHeart, 'HandHelping');
export const UserCog = make(P.UserGear, 'UserCog');
export const MoreHorizontal = make(P.DotsThree, 'MoreHorizontal');
export const TrendingUp = make(P.TrendUp, 'TrendingUp');
export const Ticket = make(P.Ticket, 'Ticket');
export const Hourglass = make(P.Hourglass, 'Hourglass');
export const ImageIcon = Image;
export const UserIcon = User;
