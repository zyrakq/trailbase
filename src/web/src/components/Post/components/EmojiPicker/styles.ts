import styled, { css } from 'styled-components';

import { EmoEmojiPickerWrapperProps } from './types';

export const EmojiPickerWrapper = styled.div<EmoEmojiPickerWrapperProps>`
  ${(props) =>
    !props.withoutPositioning &&
    css`
      position: absolute;
      bottom: 40px;
      right: 0;

      &.bt-0 {
        bottom: 0;
      }
    `}

  .emoji-mart,
  .emoji-mart * {
    box-sizing: border-box;
    line-height: 1.15;
  }

  .emoji-mart {
    font-size: 16px;
    display: inline-block;
    color: #222427;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    background: #fff;
    width: 246px !important;
    height: 272px !important;
    padding: 16px;
  }

  .emoji-mart .emoji-mart-emoji {
    padding: 6px;
  }

  .emoji-mart-bar {
    display: none;
  }

  .emoji-mart-anchors {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 0 6px;
    line-height: 0;
  }

  .emoji-mart-scroll {
    overflow-y: scroll;
    overflow-x: hidden;
    height: 238px;
    padding: 0 6px 6px 6px;
    will-change: transform;

    /* width */
    ::-webkit-scrollbar {
      width: 6px;
    }

    /* Track */
    ::-webkit-scrollbar-track {
      background: #f6f8fa;
      background-clip: content-box;
      border-radius: 10px;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
      background: #dbe0e5;
      border-radius: 10px;
      height: 50px;
    }
  }

  .emoji-mart-search {
    display: none;
  }

  .emoji-mart-category .emoji-mart-emoji span {
    z-index: 1;
    position: relative;
    text-align: center;
    cursor: default;
  }

  .emoji-mart-category .emoji-mart-emoji:hover:before {
    z-index: 0;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #f4f4f4;
    border-radius: 100%;
  }

  .emoji-mart-category-label {
    z-index: 2;
    position: relative;
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    text-align: left;
    font-weight: 600;
    color: #7e8389;
    font-style: normal;
    font-size: 12px;
    line-height: 16px;
  }

  .emoji-mart-category-label span {
    display: block;
    width: 100%;
    font-weight: 500;
    padding: 5px 6px;
    background-color: #fff;
    background-color: rgba(255, 255, 255, 0.95);
  }

  .emoji-mart-category-list {
    margin: 0;
    padding: 0;
  }

  .emoji-mart-category-list li {
    list-style: none;
    margin: 0;
    padding: 0;
    display: inline-block;
  }

  .emoji-mart-emoji {
    position: relative;
    display: inline-block;
    font-size: 0;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    box-shadow: none;
  }

  .emoji-mart-no-results {
    font-size: 14px;
    text-align: center;
    padding-top: 70px;
    color: #858585;
  }
  .emoji-mart-no-results-img {
    display: block;
    margin-left: auto;
    margin-right: auto;
    width: 50%;
  }
  .emoji-mart-no-results .emoji-mart-category-label {
    display: none;
  }
  .emoji-mart-no-results .emoji-mart-no-results-label {
    margin-top: 0.2em;
  }
  .emoji-mart-no-results .emoji-mart-emoji:hover:before {
    content: none;
  }

  .emoji-mart-preview {
    position: relative;
    height: 70px;
  }

  .emoji-mart-preview-emoji,
  .emoji-mart-preview-data,
  .emoji-mart-preview-skins {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  .emoji-mart-preview-emoji {
    left: 12px;
  }

  .emoji-mart-preview-data {
    left: 68px;
    right: 12px;
    word-break: break-all;
  }

  .emoji-mart-preview-name {
    font-size: 14px;
  }

  .emoji-mart-preview-shortname {
    font-size: 12px;
    color: #888;
  }
  .emoji-mart-preview-shortname + .emoji-mart-preview-shortname,
  .emoji-mart-preview-shortname + .emoji-mart-preview-emoticon,
  .emoji-mart-preview-emoticon + .emoji-mart-preview-emoticon {
    margin-left: 0.5em;
  }

  .emoji-mart-preview-emoticon {
    font-size: 11px;
    color: #bbb;
  }

  .emoji-mart-title span {
    display: inline-block;
    vertical-align: middle;
  }

  .emoji-mart-title .emoji-mart-emoji {
    padding: 0;
  }

  .emoji-mart-title-label {
    color: #999a9c;
    font-size: 26px;
    font-weight: 300;
  }

  /* For screenreaders only, via https://stackoverflow.com/a/19758620 */
  .emoji-mart-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  /*
     * Dark mode styles
     */

  .emoji-mart-dark {
    color: #fff;
    border-color: #555453;
    background-color: #222;
  }

  .emoji-mart-dark .emoji-mart-bar {
    border-color: #555453;
  }

  .emoji-mart-dark .emoji-mart-search input {
    color: #fff;
    border-color: #555453;
    background-color: #2f2f2f;
  }

  .emoji-mart-dark .emoji-mart-search-icon svg {
    fill: #fff;
  }

  .emoji-mart-dark .emoji-mart-category .emoji-mart-emoji:hover:before {
    background-color: #444;
  }

  .emoji-mart-dark .emoji-mart-category-label span {
    background-color: #222;
    color: #fff;
  }

  .emoji-mart-dark .emoji-mart-anchor:hover,
  .emoji-mart-dark .emoji-mart-anchor:focus,
  .emoji-mart-dark .emoji-mart-anchor-selected {
    color: #bfbfbf;
  }
`;
