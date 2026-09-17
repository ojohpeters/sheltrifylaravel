import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders an overlay at the end of <body>, outside the page's own tree.
 *
 * A `position: fixed` element is positioned against the viewport only while no
 * ancestor has a transform, filter, backdrop-filter, perspective or
 * `will-change` for one of those — any of which makes that ancestor the
 * containing block instead. Every page here renders inside <main>, so one such
 * property there silently repositions every modal in the app: they cover the
 * document rather than the screen and open near the top of the page, which
 * reads as the button doing nothing.
 *
 * That is exactly what the page-enter animation did by holding its last
 * keyframe. Rather than rely on no one reintroducing it — a hover effect or a
 * sticky wrapper is enough — overlays render past it.
 */
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (typeof document === 'undefined') return null;

    return createPortal(children, document.body);
};

export default Portal;
