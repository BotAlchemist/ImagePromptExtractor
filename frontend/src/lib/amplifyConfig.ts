import type { ResourcesConfig } from 'aws-amplify';

export const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID as string,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID as string,
      loginWith: {
        email: true,
      },
    },
  },
};
