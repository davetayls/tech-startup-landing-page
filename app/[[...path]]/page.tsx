import {
  UniformComposition,
  PageParameters,
  retrieveRoute,
} from "@uniformdev/canvas-next-rsc";
import { resolveComponent } from "@/uniform/resolve";

export default async function Page(props: PageParameters) {
  const route = await retrieveRoute(props);
  return (
    <>
      <UniformComposition
        {...props}
        route={route}
        resolveComponent={resolveComponent}
        mode="server"
      />
    </>
  );
}

