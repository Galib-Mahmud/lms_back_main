'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { isAdmin, isContentManager } = require('../../../utils/access');

const canManagePost = (user, post) => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isContentManager(user)) {
    const authorId = post.author?.id ?? post.author;
    // Content managers manage the posts they create per the permission matrix.
    return !authorId || authorId === user.id;
  }
  return false;
};

module.exports = createCoreController('api::blog-post.blog-post', ({ strapi }) => ({
  // Public: only published posts. Admin/Content Manager: everything (so they can manage drafts).
  async find(ctx) {
    const user = ctx.state.user;
    if (!user || !(isAdmin(user) || isContentManager(user))) {
      ctx.query.filters = { ...(ctx.query.filters || {}), status: 'published' };
    }
    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    const post = await strapi.db.query('api::blog-post.blog-post').findOne({
      where: { id: ctx.params.id },
      populate: ['author'],
    });
    if (!post) return ctx.notFound('Post not found.');

    if (post.status !== 'published' && !canManagePost(user, post)) {
      return ctx.notFound('Post not found.');
    }
    return super.findOne(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user || !(isAdmin(user) || isContentManager(user))) {
      return ctx.forbidden('Only Admins and Content Managers can write blog posts.');
    }
    ctx.request.body.data = ctx.request.body.data || {};
    ctx.request.body.data.author = user.id;
    return super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    const post = await strapi.db.query('api::blog-post.blog-post').findOne({
      where: { id: ctx.params.id },
      populate: ['author'],
    });
    if (!post) return ctx.notFound('Post not found.');
    if (!canManagePost(user, post)) return ctx.forbidden('You cannot edit this post.');
    return super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    const post = await strapi.db.query('api::blog-post.blog-post').findOne({
      where: { id: ctx.params.id },
      populate: ['author'],
    });
    if (!post) return ctx.notFound('Post not found.');
    if (!canManagePost(user, post)) return ctx.forbidden('You cannot delete this post.');
    return super.delete(ctx);
  },
}));
