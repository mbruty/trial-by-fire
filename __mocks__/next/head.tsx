// Mock from https://github.com/vercel/next.js/discussions/11060

import type { FC } from 'react';
import React from 'react';
import ReactDOM from 'react-dom';

// eslint-disable-next-line
// @ts-ignore
const HeadMock: FC = ({ children }) => {
    return <>{ReactDOM.createPortal(children, document.head)}</>;
};

export default HeadMock