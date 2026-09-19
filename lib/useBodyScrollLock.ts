"use client";

import { useEffect } from "react";

type BodyScrollSnapshot = {
  bodyOverflow: string;
  bodyOverscrollBehavior: string;
  bodyPaddingRight: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
  htmlOverflow: string;
  htmlOverscrollBehavior: string;
};

let lockCount = 0;
let snapshot: BodyScrollSnapshot | null = null;
let lockedScrollY = 0;

function lockBodyScroll() {
  if (lockCount === 0) {
    lockedScrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const bodyPaddingRight =
      parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;

    snapshot = {
      bodyOverflow: document.body.style.overflow,
      bodyOverscrollBehavior: document.body.style.overscrollBehavior,
      bodyPaddingRight: document.body.style.paddingRight,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      htmlOverflow: document.documentElement.style.overflow,
      htmlOverscrollBehavior: document.documentElement.style.overscrollBehavior,
    };

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;
    }
  }

  lockCount += 1;
}

function unlockBodyScroll() {
  if (lockCount === 0) return;

  lockCount -= 1;
  if (lockCount > 0 || !snapshot) return;

  const scrollY = lockedScrollY;
  document.body.style.overflow = snapshot.bodyOverflow;
  document.body.style.overscrollBehavior = snapshot.bodyOverscrollBehavior;
  document.body.style.paddingRight = snapshot.bodyPaddingRight;
  document.body.style.position = snapshot.bodyPosition;
  document.body.style.top = snapshot.bodyTop;
  document.body.style.left = snapshot.bodyLeft;
  document.body.style.right = snapshot.bodyRight;
  document.body.style.width = snapshot.bodyWidth;
  document.documentElement.style.overflow = snapshot.htmlOverflow;
  document.documentElement.style.overscrollBehavior = snapshot.htmlOverscrollBehavior;

  snapshot = null;
  window.scrollTo(0, scrollY);
}

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    lockBodyScroll();
    return unlockBodyScroll;
  }, [active]);
}
