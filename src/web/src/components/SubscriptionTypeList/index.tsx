import { List } from "antd";
import { FC } from "react";
import { SubscriptionType } from "./components/SubscriptionType";
import {
  LoadingStatus,
  SubscriptionTypeModel,
  useSubscriptionTypeListLoader,
} from "./provider";
import { useTranslation } from "@/services/i18n";
import { StyledWidget } from "./styles";
import { Divider, Title } from "@/ui";
import { EmptyPlaceholder } from "./components/EmptyPlaceholder";
import { SpinnerPlaceholder } from "./components/SpinnerPlaceholder";

export {
  SubscriptionTypeListProvider,
  useSubscriptionTypeListLoader,
  RateProvider,
  useRate,
} from "./provider";

export type {
  SubscriptionTypeModel,
  SubscriptionTypeListLoaderManager,
  RateManager,
} from "./provider";

export const SubscriptionTypeList: FC = () => {
  const { t } = useTranslation("common");

  const { list, status } = useSubscriptionTypeListLoader();

  const rowRenderer = (
    subscription_type: SubscriptionTypeModel,
    index: number
  ) => {
    const isLast = list.length - 1 === index;
    return (
      <>
        <SubscriptionType
          key={subscription_type.uuid}
          subscription_type={subscription_type}
        />
        {!isLast && <Divider style={{ margin: "15px 0" }} />}
      </>
    );
  };

  return (
    <div style={{ width: "100%" }}>
      <StyledWidget>
        <Title
          style={{ paddingLeft: 15 }}
          variant="h4"
          color="secondary"
          textTransform="uppercase"
        >
          {t("subscription_types.title")}
        </Title>
        <Divider style={{ margin: "5px 0 15px 0" }} />
        <SpinnerPlaceholder condition={status !== LoadingStatus.Loading}>
          <EmptyPlaceholder condition={list.length > 0}>
            <List dataSource={list} renderItem={rowRenderer} />
          </EmptyPlaceholder>
        </SpinnerPlaceholder>
      </StyledWidget>
    </div>
  );
};
