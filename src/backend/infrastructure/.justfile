werf-dev-convert:
  kompose convert -f docker-compose.dev.yml -o ./.helm/templates;
  rm ./.helm/templates/*-networkpolicy.yaml;
  rm ./.helm/templates/*persistentvolumeclaim.yaml;
  find ./.helm/templates -type f -exec sed -i "s/'{{{{ \(.*\) }}'/{{{{ \1 }}/g" {} +;
  find ./.helm/templates -type f -exec sed -i "s/\.values/\.Values/g" {} +;

werf-dev-up *FLAGS:
  werf converge --config='werf.dev.yaml' {{FLAGS}}
werf-dev-down *FLAGS:
  werf dismiss --config='werf.dev.yaml' {{FLAGS}}
werf-dev-cleanup *FLAGS:
  werf cleanup --config='werf.dev.yaml' {{FLAGS}}