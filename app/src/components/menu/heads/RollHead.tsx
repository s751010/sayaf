import type { CSSProperties } from "react";
import { Corner, type HeadProps } from "../SkinHeads";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

export function RollHead({ restaurant, corner, children }: HeadProps) {
  return (
    <header className="m-head m-head-roll relative px-4 pb-2 pt-14 text-center">
      <Corner>{corner}</Corner>
      <h1 className="m-title text-4xl" style={display}>{restaurant.name}</h1>
      {children && <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </header>
  );
}

export function RollHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-rl-h mb-5">
      <h2 className="text-2xl" style={display}>{name}</h2>
      {items && <span>{items}</span>}
      {photo}
    </div>
  );
}
