/**
 * Device feature detection utilities
 */

export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

export function hasMobileUserAgent(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function isSmallScreen(breakpoint = 768): boolean {
  return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
}

export function hasCoarsePointer(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

export function canHover(): boolean {
  return window.matchMedia('(hover: hover)').matches;
}


export function isMobileDevice(options: {
  screenBreakpoint?: number;
  requireTouch?: boolean;
  checkUserAgent?: boolean;
} = {}): boolean {
  const {
    screenBreakpoint = 768,
    requireTouch = true,
    checkUserAgent = true,
  } = options;

  const hasTouch = isTouchDevice();
  const hasMobileUA = checkUserAgent && hasMobileUserAgent();
  const smallScreen = isSmallScreen(screenBreakpoint);
  const coarsePointer = hasCoarsePointer();

  // If touch is required and not present, not mobile
  if (requireTouch && !hasTouch) {
    return false;
  }

  // If any two conditions are met, consider it mobile
  const conditions = [hasTouch, hasMobileUA, smallScreen, coarsePointer];
  const metConditions = conditions.filter(Boolean).length;

  return metConditions >= 2;
}

export function hasPhysicalKeyboard(): boolean {
  // Desktop devices almost always have keyboards
  if (!isTouchDevice() && !hasMobileUserAgent()) {
    return true;
  }

  // Check for indicators of keyboard presence
  const hasMouseSupport = window.matchMedia(
    '(hover: hover) and (pointer: fine)'
  ).matches;
  const isLargeScreen = window.innerWidth > 1024;
  const isDesktopUA =
    /Windows|Macintosh|CrOS/.test(navigator.userAgent) ||
    (/Linux/.test(navigator.userAgent) && !/Android/.test(navigator.userAgent));

  // Tablets with keyboards often have these characteristics
  const isTabletWithKeyboard =
    isTouchDevice() && isLargeScreen && hasMouseSupport;

  return isDesktopUA || isTabletWithKeyboard;
}


export function shouldUseTouchControls(): boolean {
  // If device has a physical keyboard, always prefer keyboard controls
  if (hasPhysicalKeyboard()) {
    return false;
  }

  // Otherwise, use touch controls if device supports touch
  return isTouchDevice();
}


export function getPointerType(): 'touch' | 'mouse' | 'unknown' {
  if (isTouchDevice() && hasCoarsePointer()) {
    return 'touch';
  } else if (canHover() && !hasCoarsePointer()) {
    return 'mouse';
  }
  return 'unknown';
}


export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

export interface DeviceInfo {
  touch: boolean;
  mobileUA: boolean;
  smallScreen: boolean;
  coarsePointer: boolean;
  canHover: boolean;
  pointerType: 'touch' | 'mouse' | 'unknown';
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hasPhysicalKeyboard: boolean;
  shouldUseTouchControls: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}

export function getDeviceInfo(): DeviceInfo {
  return {
    // Basic detection
    touch: isTouchDevice(),
    mobileUA: hasMobileUserAgent(),
    smallScreen: isSmallScreen(),
    coarsePointer: hasCoarsePointer(),
    canHover: canHover(),
    pointerType: getPointerType(),

    // Device type
    isMobile: isMobileDevice(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),

    // Keyboard info
    hasPhysicalKeyboard: hasPhysicalKeyboard(),
    shouldUseTouchControls: shouldUseTouchControls(),

    // Screen info
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
  };
}
