import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const hasR2 =
    env('R2_ACCESS_KEY_ID') && env('R2_SECRET_ACCESS_KEY') && env('R2_ENDPOINT') && env('R2_BUCKET');

  return {
    ...(hasR2
      ? {
          upload: {
            config: {
              provider: 'aws-s3',
              providerOptions: {
                baseUrl: env('R2_PUBLIC_URL'),
                s3Options: {
                  endpoint: env('R2_ENDPOINT'),
                  region: 'auto',
                  credentials: {
                    accessKeyId: env('R2_ACCESS_KEY_ID'),
                    secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
                  },
                  forcePathStyle: true,
                  params: {
                    Bucket: env('R2_BUCKET'),
                  },
                },
              },
              sizeLimit: 200 * 1024 * 1024,
              actionOptions: {
                upload: {},
                uploadStream: {},
                delete: {},
              },
            },
          },
        }
      : {}),
  };
};

export default config;
