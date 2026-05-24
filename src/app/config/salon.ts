import {SalonCategory, SalonType} from "../../otterbots/types/salonType";

const MINECRAFT_ROLE_ID = "1112714361111335032";

/** With this function you can get the information of a salon in relation to its creation alias
 * ---------------------
* getSalonByAlias("<alias of salon>")
 * ---------------------
**/

/**
 * @type {SalonCategory[]} Array of salon category objects.
 * @property {number} id The unique identifier of the category.
 * @property {string} name The name of the category.
 * @property {string} role_id The identifier of the role associated with the category.
  **/
export const salonCategory: SalonCategory[] = [
    // Here your list of categories
    {
        id: 1,
        name: "Minecraft",
        role_id: MINECRAFT_ROLE_ID
    }
]

/**
 * @type {SalonType[]} Array of salon configuration objects.
 * @property {string} name The name of the salon.
 * @property {string} role_id The identifier of the role associated with the salon.
 * @property {number} type The type of the salon (e.g., 0 for default types).
 * @property {number} category The category ID associated with the salon.
 */
export const botSalon: SalonType[] = [
    // Here your list of salons
    {
        alias: "discu-mc",
        name: "🌌・discu-mc",
        role_id: MINECRAFT_ROLE_ID,
        category: 1,
        type: 1,
        webhook: true
    },
    {
        alias: "moderator-only",
        name: "💥・moderator-only🛑",
        role_id: MINECRAFT_ROLE_ID,
        category: 1,
        type: 1,
        webhook: false
    }
];