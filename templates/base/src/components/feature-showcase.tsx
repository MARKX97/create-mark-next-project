'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useFeatureStore } from '@/stores/use-feature-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FeatureShowcase() {
  const { features, activeId, setActive } = useFeatureStore();
  const activeFeature = features.find(feature => feature.id === activeId);

  if (!activeFeature) {
    return null;
  }

  return (
    <section className='grid gap-6 rounded-3xl border bg-card/60 p-6 shadow-sm backdrop-blur lg:grid-cols-[240px_1fr]'>
      <div className='flex flex-col gap-2'>
        <p className='text-sm uppercase tracking-wide text-muted-foreground'>
          Interactive stack / 互动技术栈
        </p>
        {features.map(feature => (
          <button
            key={feature.id}
            type='button'
            onClick={() => setActive(feature.id)}
            className={cn(
              'rounded-2xl border px-3 py-2 text-left transition',
              feature.id === activeId
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-transparent hover:bg-muted'
            )}
          >
            <p className='text-sm font-semibold'>
              {feature.title.en}
              <span className='ml-1 text-xs text-muted-foreground'>
                {feature.title.zh}
              </span>
            </p>
            <p className='text-xs text-muted-foreground'>
              {feature.summary.en}
              <br />
              <span>{feature.summary.zh}</span>
            </p>
          </button>
        ))}
      </div>
      <div className='space-y-4 rounded-2xl border bg-background/80 p-6 shadow-inner'>
        <div>
          <p className='text-sm uppercase tracking-wide text-muted-foreground'>
            Currently focused / 当前关注
          </p>
          <h3 className='text-2xl font-semibold'>
            {activeFeature.title.en}
            <span className='ml-2 text-base text-muted-foreground'>
              {activeFeature.title.zh}
            </span>
          </h3>
          <p className='mt-2 text-muted-foreground'>
            {activeFeature.summary.en}
            <br />
            <span className='text-sm text-muted-foreground'>
              {activeFeature.summary.zh}
            </span>
          </p>
        </div>
        <Button asChild>
          <Link href={activeFeature.docsUrl} target='_blank' rel='noreferrer'>
            {activeFeature.actionLabel.en} / {activeFeature.actionLabel.zh}
            <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </div>
    </section>
  );
}
