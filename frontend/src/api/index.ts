import * as auth from './auth';
import * as catalog from './catalog';
import * as rules from './rules';
import * as subscriptions from './subscriptions';
import * as invoices from './invoices';
import * as finance from './finance';
import * as outbox from './outbox';

export * from './client';
export * from './auth';
export * from './catalog';
export * from './rules';
export * from './subscriptions';
export * from './invoices';
export * from './finance';
export * from './outbox';

export const api = {
  ...auth.authApi,
  getUsers: auth.getUsers,
  listUsers: auth.getUsers,
  getDevEmails: outbox.getDevEmails,
  listProducts: catalog.getProducts,
  getProducts: catalog.getProducts,
  listPlans: catalog.getPlans,
  getPlans: catalog.getPlans,
  listTaxRules: rules.getTaxRules,
  listDiscountRules: rules.getDiscountRules,
  listQuotationTemplates: rules.getQuotationTemplates,
  listSubscriptions: subscriptions.getSubscriptions,
  listInvoices: invoices.getInvoices,
  ...finance,
};
