import type { Trade } from '../types';
import { Flame, Zap, Wrench, Cog, Truck, Crane, HandHelping, ShieldCheck, UserCog, MoreHorizontal, type AppIcon } from '../components/ui/icons';

/** One icon per trade, used on trade chips and pickers. */
export const TRADE_ICON: Record<Trade, AppIcon> = {
  welder: Flame,
  electrician: Zap,
  fitter: Wrench,
  machine_operator: Cog,
  driver: Truck,
  crane_operator: Crane,
  helper: HandHelping,
  security: ShieldCheck,
  supervisor: UserCog,
  other: MoreHorizontal,
};
