import React from 'react';
import Svg, { Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode, Path, Circle, Text, TSpan } from 'react-native-svg';
import { ViewStyle, StyleProp } from 'react-native';

interface LogoProps {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const Logo: React.FC<LogoProps> = ({ width = 200, height = 220, style }) => {
  return (
    <Svg viewBox="0 0 200 220" width={width} height={height} style={style}>
      <Defs>
        <Filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <FeGaussianBlur stdDeviation="3" result="blur" />
          <FeMerge>
            <FeMergeNode in="blur" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>

      {/* Map Pin */}
      <Path 
        stroke="#00D4FF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)" 
        d="M100,105 C100,105 87,85 87,70 A13,13 0 1,1 113,70 C113,85 100,105 100,105 Z" 
      />
      <Circle stroke="#39FF14" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)" cx="100" cy="70" r="3" />

      {/* Inner Orbit */}
      <Path 
        stroke="#00D4FF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)" 
        d="M96,105 C85,100 76,90 76,75 A24,24 0 0,1 118,58" 
      />
      <Circle fill="#39FF14" filter="url(#glow)" cx="125" cy="55" r="4.5" />

      {/* Outer Orbit Segment 1 */}
      <Path 
        stroke="#00D4FF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)" 
        d="M80,140 A7.5,7.5 0 0,1 65,140 L65,75 A35,35 0 0,1 123,45" 
      />

      {/* Outer Orbit Segment 2 */}
      <Path 
        stroke="#00D4FF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)" 
        d="M132,55 A35,35 0 0,1 135,70" 
      />
      <Circle fill="#39FF14" filter="url(#glow)" cx="134" cy="80" r="4.5" />

      {/* Outer Orbit Segment 3 */}
      <Path 
        stroke="#00D4FF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)" 
        d="M128,92 C120,110 105,115 95,115 C85,115 80,122 80,130 L80,140" 
      />

      {/* Text Logo */}
      <Text x="18" y="180">
        <TSpan fill="#00D4FF" fontFamily="Montserrat, sans-serif" fontSize="20" fontWeight="800" letterSpacing="1">PARK</TSpan>
        <TSpan fill="#39FF14" fontFamily="Montserrat, sans-serif" fontSize="20" fontWeight="800" letterSpacing="1">SENSE</TSpan>
      </Text>
    </Svg>
  );
};
