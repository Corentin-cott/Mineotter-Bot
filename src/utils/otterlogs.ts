import { WebhookClient } from "discord.js";

const logStyles = {
  success: "\u001b[32m[success]\u001b[0m",
  info: "\u001b[34m[info]\u001b[0m",
  warn: "\u001b[33m[warn]\u001b[0m",
  error: "\u001b[31m[error]\u001b[0m",
  errorColor: "\u001b[31m",
  importantColor: "\u001b[33m",
  resetColor: "\u001b[0m",
};

// Liste des méthodes de log
const otterlogs = {
  success: (message: string): void => {
    console.log(logStyles.success, message);
    sendLogMessage(message, false, "success");
  },
  log: (message: string): void => {
    console.log(logStyles.info, message);
    sendLogMessage(message, false, "log");
  },
  warn: (message: string): void => {
    console.warn(logStyles.warn, message);
    sendLogMessage(message, false, "warn");
  },
  error: (message: string): void => {
    console.error(logStyles.error, message);
    sendLogMessage(message, true, "error");
  },
  important: (message: string): void => {
    console.log(`${logStyles.importantColor}${message}${logStyles.resetColor}`);
  },
  silentlog: (message: string): void => {
    console.log(message);
  }
};

// Fonction pour envoyer un message dans le salon de logs
function sendLogMessage(message: string, error: boolean, type?: string): void {
  if (process.env.ENABLE_DISCORD_SUCCESS === "false" && type === "success") return;
  if (process.env.ENABLE_DISCORD_LOGS === "false" && type === "log") return;
  if (process.env.ENABLE_DISCORD_WARNS === "false" && type === "warn") return;
  if (process.env.ENABLE_DISCORD_ERRORS === "false" && type === "error") return;

  const webhookURL = error ? process.env.ERROR_WEBHOOK_URL : process.env.GLOBAL_WEBHOOK_URL;

  if (!webhookURL) {
    console.error(logStyles.error, "Webhook URL non définie dans le fichier .env !");
    return;
  }

  const webhookClient = new WebhookClient({ url: webhookURL });

  webhookClient.send({
    content: message,
    username: `OtterLogger - ${type?.toUpperCase()}`,
  }).catch((err) => {
    console.error(logStyles.error, "Erreur lors de l'envoi du message via webhook:", err);
  });
}

export default otterlogs;
