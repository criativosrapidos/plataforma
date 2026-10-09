import type { AnchorHTMLAttributes } from "react";
import { useRouterDemo } from "../router";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export default function Link({ href, onClick, ...props }: Props) {
  const { ir } = useRouterDemo();
  return (
    <a
      href={href.startsWith("#") ? href : "#"}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
        ir(href);
      }}
      {...props}
    />
  );
}
