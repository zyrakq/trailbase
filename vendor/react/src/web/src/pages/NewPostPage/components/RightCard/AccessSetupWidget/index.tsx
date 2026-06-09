import { FC, useState } from "react";
import { useTranslation } from "@/services/i18n";
import { Divider, Radio, RadioGroup, Title, Text, InputNumber } from "@/ui";
import { StyledWidget } from "./styles";
import { RadioChangeEvent, Space } from "antd";
import { CurrencySelect } from "./CurrencySelect";

export const AccessSetupWidget: FC = () => {
  const { t } = useTranslation("common");

  const [value, setValue] = useState(1);

  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value);
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
          {t("Кто может смотреть")}
        </Title>
        <Divider style={{ margin: "5px 0 15px 0" }} />
        <div style={{ padding: "0 20px" }}>
          <RadioGroup size="large" onChange={onChange} value={value}>
            <Space direction="vertical">
              <Radio value={1}>
                <Text color="secondary">
                  {t("new_post.available.everyone")}
                </Text>
              </Radio>
              <Radio disabled value={2}>
                <Text color="secondary">
                  {t("new_post.available.subscribers_only")}
                </Text>
              </Radio>
              <Radio disabled value={3}>
                <Text color="secondary">
                  {t("new_post.available.one-time_or_subscription")}
                </Text>
              </Radio>
              <Radio value={4}>
                <Text color="secondary">
                  {t("new_post.available.payment_only")}
                </Text>
              </Radio>
            </Space>
          </RadioGroup>
          {
            <div style={{ paddingTop: 15 }}>
              <Title variant="h5" color="secondary">
                {t("Стоимость поста")}
              </Title>
              <InputNumber
                stringMode
                placeholder="Введите стоймость поста"
                min="0"
                step="1"
                addonAfter={<CurrencySelect />}
                defaultValue={100}
              />
            </div>
          }
        </div>
      </StyledWidget>
    </div>
  );
};
