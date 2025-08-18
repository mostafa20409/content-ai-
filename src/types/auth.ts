export enum Roles {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  EDITOR = 'editor'
}

export type UserRole = keyof typeof Roles;