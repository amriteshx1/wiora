type Blocker = (href: string) => boolean;

let blocker: Blocker | null = null;

export function setUnsavedNavigationBlocker(next: Blocker | null) {
  blocker = next;
}

export function allowUnsavedNavigation(href: string): boolean {
  if (!blocker) return true;
  return blocker(href);
}
