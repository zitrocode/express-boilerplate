import { Router } from 'express';

// Define possible versions as a literal type
export type APIVersion = 'v1'; // You can add 'v2', 'v3', etc. here.

// Typing for each individual route
export interface RouteItem {
  path: string;
  route: Router;
}

// Typing for the collection of routes by version
export type Routers = Record<APIVersion, RouteItem[]>;
