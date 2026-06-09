environment := "development"

dev *FLAGS:
  VITE_ENVIRONMENT_NAME={{environment}} \
  NODE_ENV={{environment}} \
  PORT=3000 \
  VITE_APP_KEYCLOAK_CLIENT_ID=web \
  VITE_APP_KEYCLOAK_URL=https://keycloak.argiago.test/realms/argiago-test \
  pnpm dev --host {{FLAGS}}

build *FLAGS:
  VITE_ENVIRONMENT_NAME={{environment}} \
  NODE_ENV={{environment}} \
  PORT=3000 \
  VITE_APP_KEYCLOAK_CLIENT_ID=web \
  VITE_APP_KEYCLOAK_URL=https://keycloak.argiago.test/realms/argiago-test \
  pnpm build {{FLAGS}}

preview *FLAGS:
  VITE_ENVIRONMENT_NAME={{environment}} \
  NODE_ENV={{environment}} \
  PORT=3000 \
  VITE_APP_KEYCLOAK_CLIENT_ID=web \
  VITE_APP_KEYCLOAK_URL=https://keycloak.argiago.test/realms/argiago-test \
  pnpm preview --host {{FLAGS}}

dev_repo := "registry.test:80"

werf-dev-convert:
  kompose convert -f docker-compose.dev.yml -o ./.helm/dev/templates -n argiago;
  rm ./.helm/dev/templates/*-namespace.yaml;
  cp ./.origin/htpasswd-secret.yaml ./.helm/dev/templates/htpasswd-secret.yaml;
  find ./.helm/dev/templates -type f -exec sed -i "s/'{{{{ \(.*\) }}'/{{{{ \1 }}/g" {} +;
  find ./.helm/dev/templates -type f -exec sed -i "s/\.values/\.Values/g" {} +;

werf-dev-up *FLAGS:
  werf converge --config='werf.dev.yaml' --repo {{dev_repo}}/argiago {{FLAGS}}
werf-dev-down *FLAGS:
  werf dismiss --config='werf.dev.yaml' --repo {{dev_repo}}/argiago {{FLAGS}}
werf-dev-cleanup *FLAGS:
  werf cleanup --config='werf.dev.yaml' --repo {{dev_repo}}/argiago {{FLAGS}}


prod_repo := "registry.argiago.ru"

werf-prod-convert:
  kompose convert -f docker-compose.prod.yml -o ./.helm/prod/templates -n argiago;
  rm ./.helm/prod/templates/*-namespace.yaml;
  cp ./.origin/*-secret.yaml ./.helm/prod/templates/;
  find ./.helm/prod/templates -type f -exec sed -i "s/'{{{{ \(.*\) }}'/{{{{ \1 }}/g" {} +;
  find ./.helm/prod/templates -type f -exec sed -i "s/\.values/\.Values/g" {} +;

werf-prod-up-conf:
  kubectl create namespace argiago &>/dev/null || exit 0;
  kubectl config set-context --current --namespace=argiago;
  kubectl apply -Rf './.helm/prod/templates/*-secret.yaml';
werf-prod-down-conf:
  kubectl delete -Rf './.helm/prod/templates/*-secret.yaml';

werf-prod-up *FLAGS:
  werf converge --config='werf.prod.yaml' --repo {{prod_repo}}/argiago {{FLAGS}}
werf-prod-down *FLAGS:
  werf dismiss --config='werf.prod.yaml' --repo {{prod_repo}}/argiago {{FLAGS}}
werf-prod-cleanup *FLAGS:
  werf cleanup --config='werf.prod.yaml' --repo {{prod_repo}}/argiago {{FLAGS}}
