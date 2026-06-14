import type { Core } from '@strapi/strapi';

// Content-types the public (unauthenticated) frontend is allowed to READ.
const PUBLIC_READ_APIS = [
  'api::headache-type.headache-type',
  'api::treatment-step.treatment-step',
  'api::commitment.commitment',
  'api::doctor.doctor',
  'api::faq.faq',
  'api::pricing-plan.pricing-plan',
  'api::site-setting.site-setting',
  'api::symptom.symptom',
  'api::text-testimonial.text-testimonial',
  'api::video-testimonial.video-testimonial',
];

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * On boot, grant the Public role read-only access (find + findOne) to every
   * content-type the marketing site renders — so the Next.js frontend can fetch
   * without an API token. Idempotent: only flips permissions that are off.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) return;

    for (const uid of PUBLIC_READ_APIS) {
      const isSingle = strapi.contentTypes[uid]?.kind === 'singleType';
      const actions = isSingle ? ['find'] : ['find', 'findOne'];

      for (const action of actions) {
        const permAction = `${uid}.${action}`;
        const existing = await strapi
          .query('plugin::users-permissions.permission')
          .findOne({ where: { action: permAction, role: publicRole.id } });

        if (existing) {
          if (!existing.enabled) {
            await strapi
              .query('plugin::users-permissions.permission')
              .update({ where: { id: existing.id }, data: { enabled: true } });
          }
        } else {
          await strapi.query('plugin::users-permissions.permission').create({
            data: { action: permAction, enabled: true, role: publicRole.id },
          });
        }
      }
    }

    strapi.log.info('[bootstrap] Public read permissions ensured for marketing content-types.');
  },
};
