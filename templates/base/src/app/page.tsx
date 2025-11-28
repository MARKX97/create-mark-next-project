import { use, type ComponentType } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  Boxes,
  GitBranch,
  Hammer,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureShowcase } from '@/components/feature-showcase';

type LocalizedCopy = { en: string; zh: string };

const heroNote = Promise.resolve({
  en: 'Now running on Next.js 16 + React 19, so Partial Pre-rendering and streaming actions are ready out of the box.',
  zh: '已升级到 Next.js 16 与 React 19，默认即可体验 Partial Pre-rendering 与流式 Actions。',
});

function HeroNote() {
  const note = use(heroNote);
  return (
    <p className='text-sm text-muted-foreground'>
      {note.en}
      <br />
      <span>{note.zh}</span>
    </p>
  );
}

const techHighlights: Array<{
  title: LocalizedCopy;
  description: LocalizedCopy;
  href: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    title: {
      en: 'Tailwind CSS + shadcn/ui',
      zh: 'Tailwind CSS + shadcn/ui 组件',
    },
    description: {
      en: 'Utility-first styling plus pre-built primitives so you move from layout to polish quickly.',
      zh: '以工具类为主的样式方式，配合 shadcn/ui 的组件原子块，帮助你迅速从布局走到成品。',
    },
    href: 'https://ui.shadcn.com/',
    icon: Boxes,
  },
  {
    title: {
      en: 'Partial Pre-rendering shell',
      zh: '部分预渲染外壳',
    },
    description: {
      en: 'Keep the static shell hot while streaming interactive islands—a Next 16 default.',
      zh: 'Next 16 默认支持 Partial Pre-rendering，让静态框架与交互区分阶段渲染。',
    },
    href: 'https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering',
    icon: Sparkles,
  },
  {
    title: {
      en: 'Zustand state management',
      zh: 'Zustand 状态管理',
    },
    description: {
      en: 'A tiny yet expressive store—perfect for interactive, client-side islands.',
      zh: '轻量但可扩展的状态管理，适合构建客户端交互式模块。',
    },
    href: 'https://docs.pmnd.rs/zustand/getting-started/introduction',
    icon: BookOpenCheck,
  },
];

export default function HomePage() {
  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 lg:py-16'>
      <section className='grid gap-8 rounded-3xl border bg-gradient-to-br from-background to-muted/50 p-10 shadow-sm lg:grid-cols-[1.2fr_0.8fr]'>
        <div className='space-y-6'>
          <p className='inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground'>
            Next.js App Router Playground / Next.js 应用路由练习场
          </p>
          <h1 className='text-4xl font-semibold leading-tight tracking-tight md:text-5xl'>
            Ship modern product experiments with Tailwind, shadcn/ui, and
            Zustand.
            <br />
            <span className='text-2xl text-muted-foreground'>
              使用 Tailwind、shadcn/ui 与 Zustand 实验现代产品。
            </span>
          </h1>
          <p className='text-lg text-muted-foreground'>
            This repo intentionally stays small so you can study how each tool
            plugs into the App Router—styling, client state, and dynamic routes
            all in one place.
            <br />
            <span className='text-sm'>
              这个仓库保持轻量，便于你理解 Tailwind、shadcn/ui、Zustand 在 App
              Router 中的组合方式。
            </span>
          </p>
          <HeroNote />
          <div className='flex flex-wrap gap-3'>
            <Button asChild size='lg'>
              <Link
                href='https://nextjs.org/docs'
                target='_blank'
                rel='noreferrer'
              >
                Next.js docs / Next.js 文档
                <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </Button>
            <Button asChild variant='outline' size='lg'>
              <Link href='/guide/dynamic/params'>
                Dynamic routing tour / 动态路由导览
              </Link>
            </Button>
          </div>
        </div>
        <div className='rounded-3xl border bg-card/60 p-6 text-sm text-muted-foreground'>
          <p className='font-semibold text-foreground'>
            Authentication ready slot / 认证模块预留区
          </p>
          <p>
            This space previously showcased Auth.js. Remove or replace it with
            your own integrations—everything else stays static-export friendly.
            <br />
            <span>
              此区域曾经展示
              Auth.js，可替换为自有集成，其余内容同样适合静态导出。
            </span>
          </p>
        </div>
      </section>

      <section className='grid gap-4 md:grid-cols-3'>
        {techHighlights.map(({ title, description, href, icon: Icon }) => (
          <article
            key={title.en}
            className='rounded-3xl border bg-card/70 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md'
          >
            <Icon className='mb-4 h-10 w-10 text-primary' />
            <h3 className='text-xl font-semibold'>
              {title.en}
              <span className='mt-1 block text-sm text-muted-foreground'>
                {title.zh}
              </span>
            </h3>
            <p className='mt-2 text-sm text-muted-foreground'>
              {description.en}
            </p>
            <p className='text-xs text-muted-foreground'>{description.zh}</p>
            <Button asChild variant='link' className='px-0'>
              <Link href={href} target='_blank' rel='noreferrer'>
                Read docs / 查阅文档
                <ArrowRight className='ml-1 h-4 w-4' />
              </Link>
            </Button>
          </article>
        ))}
      </section>

      <FeatureShowcase />

      <section className='grid gap-6 rounded-3xl border bg-card/70 p-8 lg:grid-cols-2'>
        <div>
          <p className='text-sm uppercase tracking-wide text-muted-foreground'>
            Tech stack / 技术栈
          </p>
          <h2 className='text-2xl font-semibold'>
            What powers this repo? 项目基石
          </h2>
          <ul className='mt-4 space-y-3 text-sm text-muted-foreground'>
            <li>
              <span className='font-semibold text-foreground'>
                TypeScript + Next.js 16 + React 19
              </span>{' '}
              — App Router, Route Groups, Partial Pre-rendering-ready shell, and
              `generateStaticParams`.
              <br />
              <span className='text-xs text-muted-foreground'>
                App Router、Route Group、PPR、静态导出配置都在此仓库中可见。
              </span>
            </li>
            <li>
              <span className='font-semibold text-foreground'>
                Tailwind CSS
              </span>{' '}
              — configured via `tailwind.config.js`, `postcss.config.js`, and
              `globals.css`.
              <br />
              <span className='text-xs text-muted-foreground'>
                Tailwind 配置集中在上述文件，方便复用。
              </span>
            </li>
            <li>
              <span className='font-semibold text-foreground'>
                shadcn/ui style primitives
              </span>{' '}
              — custom button component using class-variance-authority, Radix
              Slot, and lucide icons.
              <br />
              <span className='text-xs text-muted-foreground'>
                按钮组件示例展示了 shadcn/ui 的写法。
              </span>
            </li>
            <li>
              <span className='font-semibold text-foreground'>
                Partial Pre-rendering
              </span>{' '}
              — keep hero sections static while streaming client islands, using
              the new route segment config.
              <br />
              <span className='text-xs text-muted-foreground'>
                通过新段配置即可启用 PPR，静态和交互内容按需输出。
              </span>
            </li>
            <li>
              <span className='font-semibold text-foreground'>Zustand</span> —
              powers the feature showcase demo.
              <br />
              <span className='text-xs text-muted-foreground'>
                Zustand 负责首页特性卡片的状态管理。
              </span>
            </li>
          </ul>
        </div>
        <div>
          <p className='text-sm uppercase tracking-wide text-muted-foreground'>
            Engineering setup / 工程配置
          </p>
          <h2 className='text-2xl font-semibold'>
            Workflow & automation 自动化流程
          </h2>
          <ul className='mt-4 space-y-3 text-sm text-muted-foreground'>
            <li className='flex items-start gap-3'>
              <GitBranch className='mt-1 h-4 w-4 text-primary' />
              <span>
                <span className='font-semibold text-foreground'>
                  GitHub Actions
                </span>{' '}
                — release (semantic-release) + deploy (gh-pages) workflows tied
                to `main`.
                <br />
                <span className='text-xs text-muted-foreground'>
                  推送到 main 自动运行发布与部署工作流。
                </span>
              </span>
            </li>
            <li className='flex items-start gap-3'>
              <Hammer className='mt-1 h-4 w-4 text-primary' />
              <span>
                <span className='font-semibold text-foreground'>
                  pnpm + lint-staged + Husky
                </span>{' '}
                — enforce ESLint, Stylelint, Prettier before every commit.
                <br />
                <span className='text-xs text-muted-foreground'>
                  通过 Husky 在提交阶段自动执行 lint/format。
                </span>
              </span>
            </li>
            <li className='flex items-start gap-3'>
              <ArrowRight className='mt-1 h-4 w-4 text-primary' />
              <span>
                <span className='font-semibold text-foreground'>
                  Static export ready
                </span>{' '}
                — `next.config.mjs` keeps `output: &apos;export&apos;` with
                optional `basePath` for GitHub Pages.
                <br />
                <span className='text-xs text-muted-foreground'>
                  通过 basePath/assetPrefix 切换，即可部署到 GitHub Pages。
                </span>
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
