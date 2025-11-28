import Link from 'next/link';
import { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { use } from 'react';

const supportedTopics = ['params', 'revalidate', 'metadata', 'ppr'];

export const metadata: Metadata = {
  title: 'Dynamic routing & PPR reference',
};

export async function generateStaticParams() {
  return supportedTopics.map(topic => ({ topic }));
}

export default function DynamicGuidePage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = use(params);
  const normalized = topic.toLowerCase();
  const isKnown = supportedTopics.includes(normalized);

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10'>
      <div className='space-y-2'>
        <p className='text-sm uppercase tracking-wide text-muted-foreground'>
          Dynamic routing / 动态路由
        </p>
        <h1 className='text-3xl font-semibold'>
          /guide/dynamic/[topic]
          <span className='ml-2 text-base text-muted-foreground'>
            动态段落示例
          </span>
        </h1>
        <p className='text-muted-foreground'>
          This page demonstrates how App Router segments are statically
          generated, how Partial Pre-rendering toggles keep the shell static,
          and how each topic still receives the{' '}
          <code className='rounded bg-muted px-1'>params.topic</code> payload at
          runtime. Use the buttons below to swap between pre-rendered topics.
          <br />
          <span className='text-sm'>
            该页面演示 App Router 如何静态生成动态段，如何通过 Partial
            Pre-rendering 保持静态外壳，并在运行时继续接收
            <code className='mx-1 rounded bg-muted px-1'>params.topic</code>
            参数。点击下方按钮在预渲染主题之间切换。
          </span>
        </p>
      </div>

      <div className='flex flex-wrap gap-3'>
        {supportedTopics.map(topic => (
          <Link
            key={topic}
            href={`/guide/dynamic/${topic}`}
            className={cn(
              'inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition',
              topic === normalized
                ? 'border-primary bg-primary text-primary-foreground shadow'
                : 'border-border text-muted-foreground hover:bg-muted'
            )}
          >
            {topic}
          </Link>
        ))}
      </div>

      <article className='space-y-4 rounded-3xl border bg-card/60 p-6'>
        {isKnown ? (
          <>
            <h2 className='text-2xl font-semibold capitalize'>{normalized}</h2>
            {normalized === 'params' && (
              <p className='text-muted-foreground'>
                You are reading from the <code>params.topic</code> value.
                Because the route exports <code>generateStaticParams()</code>,
                Next.js produced dedicated HTML for each topic while still
                passing the captured segment to the component.
                <br />
                <span className='text-sm'>
                  你正在读取 <code>params.topic</code>
                  值。因为该路由导出了 <code>generateStaticParams()</code>
                  ，Next.js 为每个主题生成独立的 HTML，同时把捕获的段传入组件。
                </span>
              </p>
            )}
            {normalized === 'revalidate' && (
              <p className='text-muted-foreground'>
                Add <code>export const revalidate = 60;</code> to re-build this
                page every minute. Dynamic segments are perfect for docs where
                you want static speed but incremental freshness.
                <br />
                <span className='text-sm'>
                  添加 <code>export const revalidate = 60;</code>
                  可每分钟重新生成该页面。动态段适合既想要静态速度、又希望增量更新的文档。
                </span>
              </p>
            )}
            {normalized === 'metadata' && (
              <p className='text-muted-foreground'>
                Because we export <code>metadata</code> from this route, you can
                tailor SEO titles per topic or generate them dynamically inside{' '}
                <code>generateMetadata</code>.
                <br />
                <span className='text-sm'>
                  由于本路由导出了 <code>metadata</code>
                  ，你可以为不同主题定制 SEO 标题，或在{' '}
                  <code>generateMetadata</code> 中动态生成。
                </span>
              </p>
            )}
            {normalized === 'ppr' && (
              <p className='text-muted-foreground'>
                Partial Pre-rendering lets this route stream client islands only
                when needed while shipping a cached shell immediately. Flip the
                route segment config to opt in or out per topic.
                <br />
                <span className='text-sm'>
                  Partial Pre-rendering
                  让该路由可先返回缓存壳体，再在需要时流式输出客户端区块。通过段配置即可选择某个主题是否启用。
                </span>
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className='text-2xl font-semibold'>
              Unknown topic &ldquo;{topic}&rdquo;
              <span className='ml-2 text-base text-muted-foreground'>
                未知主题
              </span>
            </h2>
            <p className='text-muted-foreground'>
              Only <code>{supportedTopics.join(', ')}</code> are pre-rendered.
              Visiting any other slug falls back to the default rendering and
              still shows the captured parameter.
              <br />
              <span className='text-sm'>
                只有 <code>{supportedTopics.join(', ')}</code>
                会被预渲染。访问其他 slug
                会走默认渲染流程，但仍会显示捕获到的参数。
              </span>
            </p>
          </>
        )}
      </article>

      <div className='flex justify-end text-sm font-medium text-primary'>
        <Link
          href='/'
          className='inline-flex items-center underline-offset-4 hover:underline'
        >
          Return home / 返回首页
        </Link>
      </div>
    </div>
  );
}
