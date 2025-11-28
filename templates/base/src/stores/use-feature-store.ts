'use client';

import { create } from 'zustand';

type LocalizedCopy = {
  en: string;
  zh: string;
};

export type LearningFeature = {
  id: string;
  title: LocalizedCopy;
  summary: LocalizedCopy;
  actionLabel: LocalizedCopy;
  docsUrl: string;
};

const defaultFeatures: LearningFeature[] = [
  {
    id: 'ppr',
    title: {
      en: 'Partial Pre-rendering',
      zh: '部分预渲染',
    },
    summary: {
      en: 'Ship a static shell instantly and stream interactive chunks as data resolves in Next 16.',
      zh: 'Next 16 支持先输出静态壳，再按需流式传输交互模块。',
    },
    actionLabel: {
      en: 'PPR docs',
      zh: 'PPR 文档',
    },
    docsUrl:
      'https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering',
  },
  {
    id: 'react19',
    title: {
      en: 'React 19 + use()',
      zh: 'React 19 与 use()',
    },
    summary: {
      en: 'Server components can now unwrap promises with `use()` to author progressive copy without loaders.',
      zh: '服务器组件可通过 `use()` 解 Promise，渐进输出文案，无需骨架屏。',
    },
    actionLabel: {
      en: 'React 19 blog',
      zh: 'React 19 博文',
    },
    docsUrl: 'https://react.dev/blog/2024/12/05/react-19',
  },
  {
    id: 'cache-tags',
    title: {
      en: 'Cache tags & revalidate',
      zh: '缓存标签与增量刷新',
    },
    summary: {
      en: 'Use tag-based cache invalidation to selectively refresh sections while keeping a static export baseline.',
      zh: '利用标签失效选择性刷新局部内容，同时保持静态导出基础。',
    },
    actionLabel: {
      en: 'Caching guide',
      zh: '缓存指南',
    },
    docsUrl:
      'https://nextjs.org/docs/app/building-your-application/caching#cache-tags',
  },
];

type FeatureStore = {
  features: LearningFeature[];
  activeId: string;
  setActive: (id: string) => void;
};

export const useFeatureStore = create<FeatureStore>(set => ({
  features: defaultFeatures,
  activeId: defaultFeatures[0].id,
  setActive: id => set({ activeId: id }),
}));
