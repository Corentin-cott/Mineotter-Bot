const log_success = "\u001b[32m[success]\u001b[0m "
const log_info = "\u001b[34m[info]\u001b[0m "
const log_warn= "\u001b[33m[warn]\u001b[0m "
const log_error = "\u001b[31m[error]\u001b[0m "
const error_color = "\u001b[31m"
const important_color = "\u001b[33m"
const reset_color = "\u001b[0m"

function log(message) {
    console.log(log_info + message);
}

function warn(message) {
    console.log(log_warn + message);
}

function error(message) {
    console.log(log_error + message);
}

function success(message) {
    console.log(log_success + message);
}

function important(message) {
    return important_color + message + reset_color;
}

function errorImportant(message) {
    return error_color + message + reset_color;
}

module.exports = {
    log,
    warn,
    error,
    success,
    important,
    errorImportant
};