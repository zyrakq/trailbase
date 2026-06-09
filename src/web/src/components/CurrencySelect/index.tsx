import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Currency } from "@/services/currencyList";
import { Space } from "antd";
import { Button, Divider, Paper, Select, Option, Title, Spinner } from "@/ui";
import { Plus } from "@styled-icons/icomoon";
import { useTranslation } from "@/services/i18n";
import { EmptyButtonPlaceholder } from "./EmptyButtonPlaceholder";
import { EmptyDropdownPlaceholder } from "./EmptyDropdownPlaceholder";
import { Trash } from "@styled-icons/boxicons-regular";
import { TrashButton } from "./styles";
import {
  useAvatar,
  useProfile,
  useUserCurrencyChooser,
  useUserCurrencyListLoader,
  useUserCurrencyListPersonalizer,
} from "@/services/profile";

export const CurrencySelect: FC = () => {
  const { t } = useTranslation("common");

  const { isFetching: isFetchingProfile, isLoading: isLoadingProfile } =
    useProfile();
  const { isLoading: isLoadingAvatar } = useAvatar();

  const {
    isLoading: isLoadingUserCurrencies,
    userCurrencies,
    currencies,
  } = useUserCurrencyListLoader();

  const {
    isLoading: isFetchingUserCurrencies,
    addCurrency,
    removeCurrency,
  } = useUserCurrencyListPersonalizer();

  const { userCurrency, chooseCurrency } = useUserCurrencyChooser();

  const [selectCurrency, setSelectCurrency] = useState<Currency | undefined>();

  const isDisabled = useMemo(
    () =>
      !selectCurrency ||
      (!!selectCurrency && !!userCurrencies.find((x) => x === selectCurrency)),
    [selectCurrency, userCurrencies]
  );

  const onChangeCurrency = (value: string) => {
    const currency = currencies.find((x) => x.id === value);
    setSelectCurrency(currency);
  };

  const onChangeUseCurrency = (value: string) => {
    const currency = currencies.find((x) => x.id === value);
    if (currency) {
      chooseCurrency(currency);
      setOpen(false);
    }
  };

  const onAddCurrency = async () => {
    if (selectCurrency) {
      await addCurrency(selectCurrency);
      setSelectCurrency(undefined);
    }
  };

  const [removingCurrency, setRemovingCurrency] = useState<
    Currency | undefined
  >(undefined);

  const onRemoveCurrency = async (currency: Currency) => {
    setRemovingCurrency(currency);
    await removeCurrency(currency);
    setRemovingCurrency(undefined);
  };

  const isAddingCurrency = useMemo(
    () => isFetchingUserCurrencies && !!selectCurrency,
    [selectCurrency, isFetchingUserCurrencies]
  );

  const hasRemovingCurrency = (currency: Currency) => {
    return isFetchingUserCurrencies && removingCurrency?.id === currency.id;
  };

  const [open, setOpen] = useState<boolean>(false);

  const onOpenClick = () => {
    if (!open) {
      setOpen(true);
    }
  };

  const mainRef = useRef<HTMLDivElement>(null);
  const additionalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !!mainRef.current &&
        !mainRef.current.contains(event.target as Node) &&
        (!additionalRef.current ||
          (!!additionalRef.current &&
            !additionalRef.current.contains(event.target as Node)))
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div style={{ paddingTop: 24 }}>
      <Title variant="h4" color="secondary">
        {t("Основная валюта")}
      </Title>
      <Select
        style={{ width: 582, marginTop: 5 }}
        size="large"
        placeholder={t("Выберите основную валюту")}
        loading={isFetchingProfile && !isLoadingAvatar}
        disabled={isLoadingProfile || isLoadingUserCurrencies}
        open={open}
        onClick={onOpenClick}
        dropdownRender={(menu) => (
          <Paper ref={mainRef}>
            <Space style={{ padding: "8px 8px 4px" }}>
              <Select
                size="large"
                loading={isLoadingUserCurrencies}
                disabled={isAddingCurrency}
                showSearch
                style={{ width: 300 }}
                onChange={onChangeCurrency}
                value={selectCurrency?.id}
                defaultActiveFirstOption={false}
                showArrow={false}
                filterOption={false}
                notFoundContent={null}
                options={currencies.map((item) => ({
                  label: `${item.symbol} (${item.name})`,
                  value: item.id,
                }))}
                dropdownRender={(menu) => <div ref={additionalRef}>{menu}</div>}
              />
              <EmptyButtonPlaceholder condition={!isAddingCurrency}>
                <Button
                  textTransform="none"
                  disabled={isDisabled}
                  onClick={onAddCurrency}
                >
                  <Plus style={{ marginRight: 10 }} size={16} />
                  {t("Добавить в избранное")}
                </Button>
              </EmptyButtonPlaceholder>
            </Space>
            <Divider style={{ margin: "8px 0" }} />
            <div style={{ height: 338, padding: "0 8px 0" }}>
              <Title variant="h4" color="secondary">
                {t("Избранные валюты")}
              </Title>
              <EmptyDropdownPlaceholder condition={!isLoadingUserCurrencies}>
                {menu}
              </EmptyDropdownPlaceholder>
            </div>
          </Paper>
        )}
        // options={userCurrencies.map(
        //   (item) => ({ label: `${item.symbol} (${item.name})`, value: item.id, icon: <Trash size={18} /> })
        // )}
        value={userCurrency.id}
        onChange={onChangeUseCurrency}
      >
        {userCurrencies.map((item) => (
          <Option key={item.id} value={item.id}>
            <Spinner spinning={hasRemovingCurrency(item)} fontSize={18}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {`${item.symbol} (${item.name})`}
                {userCurrency.id !== item.id && (
                  <TrashButton
                    disabled={hasRemovingCurrency(item)}
                    color="secondary"
                    onClick={() => onRemoveCurrency(item)}
                  >
                    <Trash size={18} />
                  </TrashButton>
                )}
              </div>
            </Spinner>
          </Option>
        ))}
      </Select>
    </div>
  );
};
