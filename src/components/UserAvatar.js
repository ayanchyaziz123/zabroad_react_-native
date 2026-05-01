import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

/**
 * UserAvatar — shows a real photo if available, falls back to emoji, then initials.
 *
 * Props:
 *   uri      {string|null}  — remote or local image URI
 *   emoji    {string}       — fallback emoji (e.g. '🧑‍💻')
 *   name     {string}       — used to derive initials when no uri/emoji
 *   size     {number}       — diameter in px (default 40)
 *   radius   {number}       — border radius (default size/2 for circle)
 *   bg       {string}       — background color for emoji/initials fallback
 *   style    {object}       — extra style on the outer container
 */
export default function UserAvatar({ uri, emoji, name, size = 40, radius, bg = '#1A2035', style }) {
  const r   = radius ?? size / 2;
  const fnt = size * 0.4;

  function getInitials(n) {
    if (!n) return '?';
    return n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  const container = {
    width: size, height: size, borderRadius: r,
    backgroundColor: bg,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  };

  return (
    <View style={[container, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : emoji ? (
        <Text style={{ fontSize: fnt, lineHeight: size }}>{emoji}</Text>
      ) : (
        <Text style={{ fontSize: fnt * 0.8, fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}
