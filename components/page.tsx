"use client"

import {
  ComponentProps,
  UniformSlot,
} from '@uniformdev/canvas-next-rsc/component';

type PageParameters = {
  // Page composition has no parameters
};

type PageSlots = 'content';

type PageProps = ComponentProps<PageParameters, PageSlots>;

export const Page = (props: PageProps) => {
  return (
    <main className="min-h-screen bg-background">
      <UniformSlot data={props.component} context={props.context} slot={props.slots.content} />
    </main>
  );
};

