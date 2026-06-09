import { FC, Suspense } from "react";

import { lazily } from "react-lazily";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Container, Spinner } from "@/ui";

import { OidcSecure } from "@axa-fr/react-oidc";
import { AuthorSecure } from "@/components/AuthorSecure";
import { ProfileSecure } from "@/components/ProfileSecure";

const { NotFoundPage } = lazily(() => import("@/pages/NotFoundPage"));

const { ForbbidenPage } = lazily(() => import("@/pages/ForbbidenPage"));

const { AccountSettingsPage } = lazily(
  () => import("@/pages/AccountSettingsPage")
);
const { AccountTab } = lazily(
  () => import("@/pages/AccountSettingsPage/AccountSettingsTabs/AccountTab")
);
const { ProfilePage } = lazily(() => import("@/pages/ProfilePage"));

const { NewPostPage } = lazily(() => import("@/pages/NewPostPage"));

const { PostPage } = lazily(() => import("@/pages/PostPage"));

const { HomePage } = lazily(() => import("@/pages/HomePage"));

export const App: FC = () => {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            height: "calc(100vh - 112px)",
            justifyContent: "center",
          }}
        >
          <Spinner fontSize={100} style={{ alignSelf: "center" }} />
        </div>
      }
    >
      <Routes>
        <Route
          //element={<Outlet />}
          element={
            import.meta.env.NODE_ENV === "development" ? (
              <Outlet />
            ) : (
              <OidcSecure>
                <Outlet />
              </OidcSecure>
            )
          }
        >
          <Route element={<HomePage />} path="/" />

          <Route
            element={
              <Container style={{ height: "100%", minHeight: 782 }}>
                <Outlet />
              </Container>
            }
          >
            <Route
              element={
                <OidcSecure>
                  <ProfileSecure>
                    <AccountSettingsPage />
                  </ProfileSecure>
                </OidcSecure>
              }
            >
              <Route element={<AccountTab />} path="/settings" />
            </Route>

            <Route
              element={
                <AuthorSecure>
                  <ProfilePage />
                </AuthorSecure>
              }
              path="/:username"
            />

            <Route
              element={
                <AuthorSecure>
                  <PostPage />
                </AuthorSecure>
              }
              path="/:username/posts/:uuid"
            />

            <Route
              element={
                <AuthorSecure>
                  <NewPostPage />
                </AuthorSecure>
              }
              path="/:username/new-post"
            />
          </Route>
          <Route
            element={
              <Container
                style={{ height: "calc(100vh - 112px)", minHeight: 782 }}
              >
                <Outlet />
              </Container>
            }
          >
            <Route element={<NotFoundPage />} path="404" />
            <Route element={<ForbbidenPage />} path="403" />
          </Route>
        </Route>

        <Route element={<Navigate replace to="404" />} path="*" />
      </Routes>
    </Suspense>
  );
};
