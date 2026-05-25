import React from 'react';
import { Skeleton, SkeletonCircle, SkeletonText } from './Skeleton';

/**
 * Page-specific skeleton compositions.
 * Each one mirrors the real layout of its page for a seamless loading experience.
 */

// ============================================================
// DASHBOARD SKELETON
// Hero carousel card + 3 course cards in grid
// ============================================================
export const DashboardSkeleton = () => (
  <div className="p-8 bg-gray-50 min-h-screen font-sans max-w-7xl mx-auto">
    {/* Header */}
    <div className="mb-8">
      <Skeleton className="h-8 w-72 mb-2" />
      <Skeleton className="h-4 w-56" />
    </div>

    {/* Hero Carousel Card */}
    <div className="mb-12">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[350px]">
        {/* Left: Image placeholder */}
        <div className="md:w-5/12 bg-gray-200 animate-pulse min-h-[200px]" />
        
        {/* Right: Content */}
        <div className="p-8 md:w-7/12 flex flex-col justify-center gap-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-40" />
          {/* Progress bar */}
          <Skeleton className="h-4 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl mt-2" />
        </div>
      </div>
    </div>

    {/* Section Header */}
    <Skeleton className="h-6 w-48 mb-6" />

    {/* Course Grid — 3 Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="pt-3 border-t border-gray-100">
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ))}
    </div>
  </div>
);


// ============================================================
// MARKETPLACE SKELETON
// Header + 6 course cards in grid
// ============================================================
export const MarketplaceSkeleton = () => (
  <div className="p-8 bg-gray-50 min-h-screen font-sans max-w-7xl mx-auto">
    {/* Header */}
    <div className="mb-12">
      <Skeleton className="h-10 w-64 mb-3" />
      <Skeleton className="h-5 w-96" />
    </div>

    {/* Hot Right Now Skeleton */}
    <div className="mb-12">
      {/* Slider Title */}
      <div className="flex items-center gap-2 mb-6">
        <SkeletonCircle size={7} />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-20 rounded-full ml-2" />
      </div>
      
      {/* Hero Carousel Card */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[350px] border border-gray-800">
        {/* Left: Image placeholder */}
        <div className="md:w-5/12 bg-gray-800 animate-pulse min-h-[200px]" />
        
        {/* Right: Content */}
        <div className="p-8 md:w-7/12 flex flex-col justify-center gap-6">
          <Skeleton className="h-10 w-3/4 bg-gray-700" />
          <div className="space-y-3">
             <Skeleton className="h-5 w-full bg-gray-700" />
             <Skeleton className="h-5 w-5/6 bg-gray-700" />
             <Skeleton className="h-5 w-4/6 bg-gray-700" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl bg-gray-700 mt-2" />
        </div>
      </div>
    </div>

    {/* Grid — 6 Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          {/* Thumbnail */}
          <Skeleton className="h-48 w-full rounded-none" />
          
          {/* Content */}
          <div className="p-5 flex flex-col gap-3 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <SkeletonText lines={2} />
            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);


// ============================================================
// COURSE DETAIL SKELETON
// Sidebar + main content (video + notes)
// ============================================================
export const CourseDetailSkeleton = () => (
  <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
    {/* Sidebar */}
    <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 shadow-sm flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
      
      {/* Module sections */}
      <div className="flex-1 overflow-hidden p-2 space-y-1">
        {[1, 2, 3].map((m) => (
          <div key={m}>
            <div className="px-4 py-3 bg-gray-50/80">
              <Skeleton className="h-3 w-28" />
            </div>
            {[1, 2, 3].map((l) => (
              <div key={l} className="p-3 flex items-center gap-3">
                <SkeletonCircle size={4} />
                <Skeleton className="h-3 w-36 flex-1" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 p-8 overflow-y-auto space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Title */}
        <Skeleton className="h-8 w-96" />
        
        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 pb-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-28" />
        </div>

        {/* Video Player */}
        <Skeleton className="aspect-video w-full rounded-xl" />

        {/* Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/60 flex justify-between items-center">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200/60">
          <Skeleton className="h-5 w-32 mb-4" />
          <SkeletonText lines={4} />
        </div>
      </div>
    </div>
  </div>
);


// ============================================================
// PROFILE SKELETON
// Header card + 3 stat cards
// ============================================================
export const ProfileSkeleton = () => (
  <div className="max-w-5xl mx-auto space-y-8">
    {/* Header Card */}
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-6">
        <SkeletonCircle size={24} />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>

    {/* Stats Grid — 3 Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
