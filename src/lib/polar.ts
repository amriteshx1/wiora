import { Polar } from "@polar-sh/sdk";

const server = process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production";

export const polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server,
});
