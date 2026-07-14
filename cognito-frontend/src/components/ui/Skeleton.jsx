import React from 'react';

/**
 * Reusable Skeleton primitives for loading states.
 * Uses Tailwind's `animate-pulse` for the shimmer effect.
 */

export const Skeleton = ({ className = '' }) => (
  <div className={`bg-gray-200 animate-pulse rounded-lg ${className}`} />
);

export const SkeletonCircle = ({ size = 10, className = '' }) => (
  <div className={`bg-gray-200 animate-pulse rounded-full w-${size} h-${size} ${className}`} 
       style={{ width: `${size * 0.25}rem`, height: `${size * 0.25}rem` }} />
);

// Pre-compute stable widths so Math.random() is never called during render
const SKELETON_WIDTHS = [85, 92, 88, 95, 90, 87, 93, 91, 89, 96];

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="bg-gray-200 animate-pulse rounded h-3"
        style={{ width: i === lines - 1 ? '60%' : `${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}%` }}
      />
    ))}
  </div>
);

export default Skeleton;
