import { OtterPocketBase } from "../../otterbots/utils/pocketbase/pocketbase";
import { otterlogs } from "../../otterbots/utils/otterlogs";

/**
 * Represents a list of scheduled tasks with their respective configurations.
 * Each task contains the following details:
 * - `name`: A string that specifies the name or description of the task.
 * - `time`: A cron-style string that defines when the task is scheduled to run.
 * - `task`: An asynchronous function to be executed at the specified time.
 */
export const tasks = [
    {
        name: "pocketbase-auth-refresh",
        time: "0 */6 * * *",
        period: "",
        task: async () => {
            try {
                const pb = await OtterPocketBase.getClient();
                await pb.collection("_superusers").authRefresh();
                otterlogs.debug("PocketBase: auth token refreshed.");
            } catch {
                otterlogs.warn("PocketBase: authRefresh failed, re-authenticating...");
                try {
                    const pb = await OtterPocketBase.getClient();
                    await pb.collection("_superusers").authWithPassword(
                        process.env.PB_EMAIL!,
                        process.env.PB_PASSWORD!,
                    );
                    otterlogs.debug("PocketBase: re-authentication successful.");
                } catch (err) {
                    otterlogs.error(`PocketBase: re-authentication failed: ${err}`);
                }
            }
        },
    },
];

