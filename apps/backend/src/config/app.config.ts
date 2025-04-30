import {registerAs} from "@nestjs/config"

export default registerAs('app', () => ({
    environment: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION,
    signalExpirationDays: parseInt(process.env.SIGNAL_EXPIRATION_DAYS || '7', 10),
}))