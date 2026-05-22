/**
 * Represents a PocketBase alias configuration.
 */
export interface PocketBaseAlias {
    /** Unique identifier for the alias */
    alias: string;
    /** Target PocketBase collection name */
    collection: string;
    /** SDK action to execute */
    action: 'getList' | 'getOne' | 'create' | 'update' | 'delete' | 'getFirstListItem' | 'getFullList';
    /** Default options to pass to the action */
    options?: unknown;
}

/**
 * Represents the root PocketBase configuration structure.
 */
export interface PocketBaseConfig {
    /** List of defined aliases */
    aliases: PocketBaseAlias[];
}
