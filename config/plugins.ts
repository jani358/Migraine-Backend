import type { Core } from '@strapi/strapi';

/**
 * Media uploads go to Cloudflare R2 (S3-compatible object storage), served
 * through the Cloudflare CDN — keeps large videos/images off the VPS disk.
 *
 * Required env (ask the client for these — see .env.example):
 *   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY  — R2 API token
 *   R2_ENDPOINT      — https://<accountid>.r2.cloudflarestorage.com
 *   R2_BUCKET        — the bucket name
 *   R2_PUBLIC_URL    — public dev URL or custom domain serving the bucket
 *                      (e.g. https://media.ceylonhospital.com)
 *
 * Until these are filled in, uploads fall back to local disk automatically.
 */
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const hasR2 =
    env('R2_ACCESS_KEY_ID') && env('R2_SECRET_ACCESS_KEY') && env('R2_ENDPOINT') && env('R2_BUCKET');

  return {
    // Cloudflare R2 upload provider (only when keys are present; else local disk).
    ...(hasR2
      ? {
          upload: {
            config: {
              provider: 'aws-s3',
              providerOptions: {
                baseUrl: env('R2_PUBLIC_URL'), // CDN/public URL the files are served from
                s3Options: {
                  endpoint: env('R2_ENDPOINT'),
                  region: 'auto', // R2 uses "auto"
                  credentials: {
                    accessKeyId: env('R2_ACCESS_KEY_ID'),
                    secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
                  },
                  forcePathStyle: true, // R2 requires path-style addressing
                  params: {
                    Bucket: env('R2_BUCKET'),
                  },
                },
              },
              // Generous size limit for patient testimonial videos (200 MB).
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
