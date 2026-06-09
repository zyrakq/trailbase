werf-dev-convert:
  cd ./src/web && just werf-dev-convert;
  cd ./src/keycloak && just werf-dev-convert;
  cd ./src/backend/avatar/avatar-downloader && just werf-dev-convert;
  cd ./src/backend/avatar/avatar-uploader && just werf-dev-convert;

werf-dev-up *FLAGS:
  cd ./src/web && just werf-dev-up {{FLAGS}};
  cd ./src/keycloak && just werf-dev-up {{FLAGS}};
  cd ./src/backend/avatar/avatar-downloader && just werf-dev-up {{FLAGS}};
  cd ./src/backend/avatar/avatar-uploader && just werf-dev-up {{FLAGS}};

werf-dev-down *FLAGS:
  cd ./src/web && just werf-dev-down {{FLAGS}};
  cd ./src/keycloak && just werf-dev-down {{FLAGS}};
  cd ./src/backend/avatar/avatar-downloader && just werf-dev-down {{FLAGS}};
  cd ./src/backend/avatar/avatar-uploader && just werf-dev-down {{FLAGS}};
  
werf-dev-cleanup *FLAGS:
  cd ./src/web && just werf-dev-cleanup {{FLAGS}};
  cd ./src/keycloak && just werf-dev-cleanup {{FLAGS}};
  cd ./src/backend/avatar/avatar-downloader && just werf-dev-cleanup {{FLAGS}};
  cd ./src/backend/avatar/avatar-uploader && just werf-dev-cleanup {{FLAGS}};