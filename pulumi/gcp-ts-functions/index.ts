// Copyright 2016-2019, Pulumi Corporation.  All rights reserved.

import * as gcp from "@pulumi/gcp";
import { Bucket } from "@pulumi/gcp/storage";

const bucket = new Bucket("tech-at-scale-pulumi-meetup-001", { location: "NORTHAMERICA-NORTHEAST1" });

/**
 * Deploy a function using an explicitly set runtime.
 */

const runtime = "nodejs14"; // https://cloud.google.com/functions/docs/concepts/exec#runtimes
const explicitRuntimeGreeting = new gcp.cloudfunctions.HttpCallbackFunction(`greeting-${runtime}`, {
    runtime: runtime,
    bucket: bucket,
    callback: (req, res) => {
        res.send(`Greetings from ${req.body.name || "Tech At Scale Meetup"}!`);
    },
});

export const nodejs14Url = explicitRuntimeGreeting.httpsTriggerUrl;
