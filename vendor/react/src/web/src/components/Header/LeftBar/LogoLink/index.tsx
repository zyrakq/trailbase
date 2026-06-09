import { FC } from "react";

import { NavLink } from "react-router-dom";

import { Logo } from "@/ui";

export const LogoLink: FC = () => {
  return (
    <div style={{ marginRight: 24 }}>
      <NavLink to="/">
        <Logo />
      </NavLink>
    </div>
  );
};
