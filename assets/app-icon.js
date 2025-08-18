import React from 'react';
import { Svg, Circle, Ellipse, Rect, Path, Text, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

const AppIcon = ({ size = 100 }) => (
  <Svg width={size} height={size} viewBox="0 0 200 200">
    <Defs>
      <LinearGradient id="boxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFD700" />
        <Stop offset="100%" stopColor="#FFA500" />
      </LinearGradient>
      <LinearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#E6E6FA" />
      </LinearGradient>
      <RadialGradient id="glassGradient" cx="50%" cy="30%">
        <Stop offset="0%" stopColor="#87CEEB" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#4169E1" stopOpacity="0.9" />
      </RadialGradient>
    </Defs>
    
    {/* Background circle */}
    <Circle cx="100" cy="100" r="95" fill="#6366F1" stroke="#4F46E5" strokeWidth="4"/>
    
    {/* Left wing */}
    <Ellipse cx="45" cy="95" rx="35" ry="15" fill="url(#wingGradient)" stroke="#DDD" strokeWidth="2" transform="rotate(-20 45 95)"/>
    <Ellipse cx="40" cy="90" rx="25" ry="10" fill="url(#wingGradient)" stroke="#DDD" strokeWidth="1" transform="rotate(-25 40 90)"/>
    
    {/* Right wing */}
    <Ellipse cx="155" cy="95" rx="35" ry="15" fill="url(#wingGradient)" stroke="#DDD" strokeWidth="2" transform="rotate(20 155 95)"/>
    <Ellipse cx="160" cy="90" rx="25" ry="10" fill="url(#wingGradient)" stroke="#DDD" strokeWidth="1" transform="rotate(25 160 90)"/>
    
    {/* Main package box */}
    <Rect x="70" y="80" width="60" height="50" rx="5" fill="url(#boxGradient)" stroke="#E6B800" strokeWidth="2"/>
    
    {/* Box details */}
    <Rect x="75" y="85" width="15" height="10" fill="#FFFFFF" stroke="#DDD" strokeWidth="1"/>
    <Rect x="110" y="85" width="15" height="10" fill="#FFFFFF" stroke="#DDD" strokeWidth="1"/>
    
    {/* String/ribbon around box */}
    <Path d="M70 100 Q85 95 100 100 Q115 105 130 100" stroke="#FFFFFF" strokeWidth="3" fill="none"/>
    <Path d="M100 80 Q105 90 100 100 Q95 110 100 130" stroke="#FFFFFF" strokeWidth="3" fill="none"/>
    
    {/* Bow/knot at top */}
    <Ellipse cx="95" cy="75" rx="8" ry="5" fill="#FFFFFF" stroke="#DDD" strokeWidth="1"/>
    <Ellipse cx="105" cy="75" rx="8" ry="5" fill="#FFFFFF" stroke="#DDD" strokeWidth="1"/>
    <Circle cx="100" cy="75" r="4" fill="#FFD700"/>
    
    {/* Aviator glasses frame */}
    <Ellipse cx="85" cy="65" rx="18" ry="12" fill="none" stroke="#2C3E50" strokeWidth="3"/>
    <Ellipse cx="115" cy="65" rx="18" ry="12" fill="none" stroke="#2C3E50" strokeWidth="3"/>
    <Path d="M103 65 Q107 63 111 65" stroke="#2C3E50" strokeWidth="3" fill="none"/>
    
    {/* Glasses lenses */}
    <Ellipse cx="85" cy="65" rx="16" ry="10" fill="url(#glassGradient)" opacity="0.8"/>
    <Ellipse cx="115" cy="65" rx="16" ry="10" fill="url(#glassGradient)" opacity="0.8"/>
    
    {/* Lens reflections */}
    <Ellipse cx="82" cy="62" rx="6" ry="4" fill="#FFFFFF" opacity="0.6"/>
    <Ellipse cx="112" cy="62" rx="6" ry="4" fill="#FFFFFF" opacity="0.6"/>
    
    {/* Glasses temples */}
    <Path d="M67 65 Q60 65 55 70" stroke="#2C3E50" strokeWidth="3" fill="none"/>
    <Path d="M133 65 Q140 65 145 70" stroke="#2C3E50" strokeWidth="3" fill="none"/>
    
    {/* Motion lines */}
    <Path d="M20 80 Q30 85 25 90" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.7"/>
    <Path d="M175 80 Q185 85 180 90" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.7"/>
    <Path d="M25 110 Q35 115 30 120" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.7"/>
    <Path d="M170 110 Q180 115 175 120" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.7"/>
    
    {/* Package label */}
    <Rect x="75" y="110" width="20" height="8" fill="#FFFFFF" stroke="#DDD" strokeWidth="1"/>
    <Text x="85" y="116" fontFamily="Arial, sans-serif" fontSize="6" textAnchor="middle" fill="#333">
      FAST
    </Text>
  </Svg>
);

export default AppIcon;