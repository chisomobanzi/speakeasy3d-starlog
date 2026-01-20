/**
 * Creates a debounced function that delays invoking func until after wait
 * milliseconds have elapsed since the last time the debounced function was invoked.
 *
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
export default function debounce(func, wait) {
  let timeoutId = null;

  const debounced = function (...args) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };

  debounced.cancel = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  debounced.flush = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      func.apply(this);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Creates a throttled function that only invokes func at most once per
 * every wait milliseconds.
 *
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle
 * @returns {Function} The throttled function
 */
export function throttle(func, wait) {
  let lastTime = 0;
  let timeoutId = null;

  return function (...args) {
    const now = Date.now();

    if (now - lastTime >= wait) {
      lastTime = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        func.apply(this, args);
      }, wait - (now - lastTime));
    }
  };
}
