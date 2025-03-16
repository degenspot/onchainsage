import {registerAs} from "@nestjs/config"

export default registerAs('app', () => ({
    envirment: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION,
}))