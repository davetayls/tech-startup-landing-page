import {
  DefaultNotImplementedComponent,
  ResolveComponentFunction,
  ResolveComponentResult,
} from "@uniformdev/canvas-next-rsc/component";
import { Page } from "@/components/page";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { FAQ } from "@/components/faq";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";

export const resolveComponent: ResolveComponentFunction = ({ component }) => {
  let result: ResolveComponentResult = {
    component: DefaultNotImplementedComponent,
  };

  if (component.type === "page") {
    result = {
      component: Page,
    };
  }

  if (component.type === "header") {
    result = {
      component: Header,
    };
  }

  if (component.type === "hero") {
    result = {
      component: Hero,
    };
  }

  if (component.type === "features") {
    result = {
      component: Features,
    };
  }

  if (component.type === "faq") {
    result = {
      component: FAQ,
    };
  }

  if (component.type === "cta") {
    result = {
      component: CTA,
    };
  }

  if (component.type === "footer") {
    result = {
      component: Footer,
    };
  }

  return result;
};

