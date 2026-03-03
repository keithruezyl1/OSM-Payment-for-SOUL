import { NavigationCollection, NavigationItemLocation } from '@libs/types';

export const headerNavigationItems: NavigationCollection = [
  {
    id: 1,
    label: 'Women',
    url: '/categories/women',
    sort_order: 0,
    location: NavigationItemLocation.header,
    new_tab: false,
  },
  {
    id: 2,
    label: 'Men',
    url: '/categories/men',
    sort_order: 1,
    location: NavigationItemLocation.header,
    new_tab: false,
  },
  {
    id: 3,
    label: 'Kids',
    url: '/categories/kids',
    sort_order: 2,
    location: NavigationItemLocation.header,
    new_tab: false,
  },
  {
    id: 4,
    label: 'Shops',
    url: '/shops',
    sort_order: 3,
    location: NavigationItemLocation.header,
    new_tab: false,
  },
  {
    id: 5,
    label: 'Sale',
    url: '/collections/sale',
    sort_order: 4,
    location: NavigationItemLocation.header,
    new_tab: false,
  },
];

export const footerNavigationItems: NavigationCollection = [
  {
    id: 1,
    label: 'New Arrivals',
    url: '/collections/new-arrivals',
    location: NavigationItemLocation.footer,
    sort_order: 1,
    new_tab: false,
  },
  {
    id: 2,
    label: 'Best Sellers',
    url: '/collections/best-sellers',
    location: NavigationItemLocation.footer,
    sort_order: 2,
    new_tab: false,
  },
  {
    id: 3,
    label: 'Trending',
    url: '/collections/trending',
    location: NavigationItemLocation.footer,
    sort_order: 3,
    new_tab: false,
  },
  {
    id: 4,
    label: 'Activewear',
    url: '/categories/activewear',
    location: NavigationItemLocation.footer,
    sort_order: 4,
    new_tab: false,
  },
];
