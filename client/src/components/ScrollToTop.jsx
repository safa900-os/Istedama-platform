import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Puts a new page at its top.
 *
 * A browser restores the scroll position on a document load, but a router that
 * swaps the page without one keeps whatever offset the last page left behind.
 * Following a link from halfway down the home page therefore opened the next
 * page halfway down as well — most visible on the long ones, where a reader
 * landed in the middle of the service catalogue with its heading far above.
 *
 * Two cases are deliberately left alone:
 *
 *   - Going *back* should return the reader to where they were; that is the
 *     whole point of the button. `POP` is the router's word for a back or
 *     forward move.
 *   - A hash link (`/about#objectives`) names a place on the page, and
 *     scrolling to the top would throw that away.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (hash || navigationType === 'POP') return;

    // `instant`, not the site's smooth default: this is not a movement the
    // reader asked to watch, and animating it drags the outgoing page past
    // them on the way out.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash, navigationType]);

  return null;
}
