// import { List } from 'antd';
import { Result } from "antd";
import { FC } from "react";
import { ResultBodyWrapper } from "./styles";
import { Title, Text, Paper } from "@/ui";
import { useTranslation } from "@/services/i18n";
// import { Card, Button, Paper, Title, Text, Container } from '@/ui';

// export const HomePage: FC = () => {
// 	const features = [
// 		"Вы можете получать вознаграждение за свой труд",
// 		"Быстрая и удобная оплата через сеть Lightning Network",
// 		"Надежность и безопасность благодаря протоколу webln",
// 		"Широкая аудитория пользователей",
// 	]

//   	return (
// 		<Paper style={{ padding: 24}}>
// 			<section className="hero">
// 				<Card bordered={false}>
// 					<Title variant='h1'>Продавайте доступ к своему контенту</Title>
// 					<Text component='span' color='secondary'>Вы создаете уникальный и интересный контент, но не знаете, как его монетизировать? Мы предлагаем вам простой и удобный способ продавать доступ к своим работам.</Text>
// 					<Container style={{ marginTop:40 }}>
// 						<Button variant='outlined'>Стать автором</Button>
// 					</Container>
// 				</Card>
// 			</section>

// 			<section className="features">
// 				<Card bordered={false}>
// 					<Title variant='h2'>Почему мы?</Title>

// 					<List
// 						bordered
// 						dataSource={features}
// 						renderItem={(item) => (
// 							<List.Item>
// 								<Text component='span' color='secondary'>{item}</Text>
// 							</List.Item>
// 						)}
// 					/>
// 				</Card>
// 			</section>

// 			<section className="motivation">
// 				<Card bordered={false}>
// 					<Title variant='h2'>Монетизируйте свой талант</Title>
// 					<Text component='span' color='secondary'>Мы поможем вам зарабатывать на своих работах, давая возможность пользователям покупать доступ к вашим материалам.</Text>
// 					<Container style={{ marginTop:40 }}>
// 						<Button variant='outlined'>Стать автором</Button>
// 					</Container>
// 				</Card>
// 			</section>
// 		</Paper>
// 	);
// };

export const HomePage: FC = () => {
  const { t } = useTranslation("common");

  return (
    <Paper style={{ height: "calc(100vh - 112px)", minHeight: 782 }}>
      <Result
        status="404"
        extra={
          <ResultBodyWrapper>
            <Title variant="h2">{`${t("home_page.title")}...`}</Title>
            <Text component="span" color="secondary">
              {t("home_page.description")}
            </Text>
          </ResultBodyWrapper>
        }
      />
    </Paper>
  );
};
