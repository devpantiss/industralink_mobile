import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HardHat } from 'lucide-react-native';
import type { Sector } from '../../types';

const LOGO_COLORS = ['#E8590C', '#1C7ED6', '#2F9E44', '#5F3DC4', '#495057', '#D6336C', '#0C8599', '#E67700'];

const SECTOR_GLYPH: Record<Sector, string> = {
  metals: 'M5 4h14v3.2h-5.2v9.6H19V20H5v-3.2h5.2V7.2H5z',
  shipping: 'M2 8.5c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2v3c-2.5 0-2.5-2-5-2s-2.5 2-5 2-2.5-2-5-2-2.5 2-5 2zM2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2v3c-2.5 0-2.5-2-5-2s-2.5 2-5 2-2.5-2-5-2-2.5 2-5 2z',
  logistics: 'M3 5h5l6 7-6 7H3l6-7zM10 5h5l6 7-6 7h-5l6-7z',
  automotive: 'M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zm0 5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z',
  mining: 'M1.5 20 9 6.5l4.2 7 2.3-3.5L22.5 20z',
  petroleum: 'M12 2.5s7.5 7.8 7.5 12.5a7.5 7.5 0 0 1-15 0C4.5 10.3 12 2.5 12 2.5z',
};

export function companyColor(name: string): string {
  const sum = [...name].reduce((s, c) => s + c.charCodeAt(0), 0);
  return LOGO_COLORS[sum % LOGO_COLORS.length]!;
}

interface CompanyLogoProps {
  job: {
    companyName: string;
    sector: Sector;
    companyLogoUrl?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ job, size = 'md', style }) => {
  const dimensions = size === 'sm' ? 36 : size === 'lg' ? 56 : 44;
  const borderRadius = size === 'sm' ? 10 : size === 'lg' ? 16 : 12;

  if (job.companyLogoUrl) {
    return (
      <View
        style={[
          styles.container,
          { width: dimensions, height: dimensions, borderRadius, backgroundColor: '#FFFFFF' },
          style,
        ]}
      >
        <Image
          source={{ uri: job.companyLogoUrl }}
          style={{ width: dimensions * 0.8, height: dimensions * 0.8 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  const bgColor = companyColor(job.companyName);
  const glyph = SECTOR_GLYPH[job.sector];

  return (
    <View
      style={[
        styles.container,
        { width: dimensions, height: dimensions, borderRadius, backgroundColor: bgColor },
        style,
      ]}
    >
      {glyph ? (
        <Svg viewBox="0 0 24 24" width={dimensions * 0.54} height={dimensions * 0.54}>
          <Path d={glyph} fill="#FFFFFF" fillRule="evenodd" />
        </Svg>
      ) : (
        <HardHat size={dimensions * 0.5} color="#FFFFFF" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

