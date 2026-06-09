import { FC } from "react";
import { Select, Option, Text } from "@/ui";

export const CurrencySelect: FC = () => {
  return (
    <>
      <Select defaultValue="USD" style={{ width: 60 }}>
        <Option value="USD">
          <Text color="secondary">$</Text>
        </Option>
        <Option value="EUR">
          <Text color="secondary">€</Text>
        </Option>
        <Option value="GBP">
          <Text color="secondary">£</Text>
        </Option>
        <Option value="CNY">
          <Text color="secondary">¥</Text>
        </Option>
      </Select>
    </>
  );
};
