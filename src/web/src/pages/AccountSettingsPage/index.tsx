import { FC, Suspense } from "react";

import { Outlet } from "react-router-dom";

import { Paper, Spinner } from "@/ui";

import { AccountSettingsPanelWrapper } from "./AccountSettingsPanelWrapper";
import { Col, Row } from "./styles";

export const AccountSettingsPage: FC = () => {
  return (
    <Row gutter={[16, 16]}>
      <Col flex="323px">
        <AccountSettingsPanelWrapper />
      </Col>
      <Col flex="646px">
        <Paper style={{ padding: 24 }}>
          <Suspense
            fallback={
              <div
                style={{
                  display: "flex",
                  height: "300px",
                  justifyContent: "center",
                }}
              >
                <Spinner fontSize={100} style={{ alignSelf: "center" }} />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </Paper>
      </Col>
      <Col flex="323px" />
    </Row>
  );
};
