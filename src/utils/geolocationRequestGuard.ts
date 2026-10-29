/** Bloqueia uso de callbacks GPS de solicitações antigas/canceladas. */
export function createLocationRequestGuard() {
  let currentVersion = 0;
  return {
    begin() {
      const myVersion = ++currentVersion;
      return { isCurrent: () => currentVersion === myVersion };
    },
    cancel() {
      currentVersion += 1;
    },
  };
}
