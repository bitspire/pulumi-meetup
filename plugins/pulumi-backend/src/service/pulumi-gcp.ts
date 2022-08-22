import { Config } from "@backstage/config";
import { Logger } from "winston";
import { RouterOptions } from './router';
import * as express from 'express';
import {
    LocalWorkspace,
    ConcurrentUpdateError,
    StackAlreadyExistsError,
    StackNotFoundError
} from "@pulumi/pulumi/automation";
import * as gcp from "@pulumi/gcp";
import { Bucket } from "@pulumi/gcp/storage";

export default class PulumiGcp {
    logger: Logger;

    config: Config;

    projectName = "tech-at-scale-pulumi";

    public constructor(options: RouterOptions) {
        const { logger, config } = options;

        this.logger = logger;
        this.config = config;
    }

    public createPulumiProgram = (content: string) => async () => {
        const bucket = new Bucket("tech-at-scale-pulumi-meetup-001", { location: "NORTHAMERICA-NORTHEAST1" });

        /**
         * Deploy a function using an explicitly set runtime.
         */

        const runtime = "nodejs14"; // https://cloud.google.com/functions/docs/concepts/exec#runtimes
        const explicitRuntimeGreeting = new gcp.cloudfunctions.HttpCallbackFunction(`greeting-${runtime}`, {
            runtime: runtime,
            bucket: bucket,
            callback: (_req, res) => {
                res.send(`Greetings from ${content || "Tech At Scale Meetup"}!`);
            },
        });


        return {
            functionUrl: explicitRuntimeGreeting.httpsTriggerUrl,
        };
    };
    // creates new sites
    public createHandler: express.RequestHandler = async (req, res) => {
        const stackName = req.body.id;
        const content = req.body.content as string;
        const projectName = this.projectName;
        try {
            // create a new stack
            const stack = await LocalWorkspace.createStack({
                stackName,
                projectName,
                // generate our pulumi program on the fly from the POST body
                program: this.createPulumiProgram(content),
            });
            await stack.setConfig("aws:region", { value: "us-west-2" });
            // deploy the stack, tailing the logs to console
            const upRes = await stack.up({ onOutput: console.info });
            res.json({ id: stackName, url: upRes.outputs.websiteUrl.value });
        } catch (e) {
            if (e instanceof StackAlreadyExistsError) {
                res.status(409).send(`stack "${stackName}" already exists`);
            } else {
                res.status(500).send(e);
            }
        }
    };
    // lists all sites
    public listHandler: express.RequestHandler = async (_req, res) => {
        try {
            // set up a workspace with only enough information for the list stack operations
            const ws = await LocalWorkspace.create({ projectSettings: { name: this.projectName, runtime: "nodejs" } });
            const stacks = await ws.listStacks();
            res.json({ ids: stacks.map(s => s.name) });
        } catch (e) {
            res.status(500).send(e);
        }
    };
    // gets info about a specific site
    public getHandler: express.RequestHandler = async (req, res) => {
        const stackName = req.params.id;
        const projectName = this.projectName;
        try {
            // select the existing stack
            const stack = await LocalWorkspace.selectStack({
                stackName,
                projectName,
                // don't need a program just to get outputs
                program: async () => { },
            });
            const outs = await stack.outputs();
            res.json({ id: stackName, url: outs.websiteUrl.value });
        } catch (e) {
            if (e instanceof StackNotFoundError) {
                res.status(404).send(`stack "${stackName}" does not exist`);
            } else {
                res.status(500).send(e);
            }
        }
    };
    // updates the content for an existing site
    public updateHandler: express.RequestHandler = async (req, res) => {
        const stackName = req.params.id;
        const content = req.body.content as string;
        const projectName = this.projectName;
        try {
            // select the existing stack
            const stack = await LocalWorkspace.selectStack({
                stackName,
                projectName,
                // generate our pulumi program on the fly from the POST body
                program: this.createPulumiProgram(content),
            });
            await stack.setConfig("aws:region", { value: "us-west-2" });
            // deploy the stack, tailing the logs to console
            const upRes = await stack.up({ onOutput: console.info });
            res.json({ id: stackName, url: upRes.outputs.websiteUrl.value });
        } catch (e) {
            if (e instanceof StackNotFoundError) {
                res.status(404).send(`stack "${stackName}" does not exist`);
            } else if (e instanceof ConcurrentUpdateError) {
                res.status(409).send(`stack "${stackName}" already has update in progress`)
            } else {
                res.status(500).send(e);
            }
        }
    };
    // deletes a site
    public deleteHandler: express.RequestHandler = async (req, res) => {
        const stackName = req.params.id;
        const projectName = this.projectName;
        try {
            // select the existing stack
            const stack = await LocalWorkspace.selectStack({
                stackName,
                projectName,
                // don't need a program for destroy
                program: async () => { },
            });
            // deploy the stack, tailing the logs to console
            await stack.destroy({ onOutput: console.info });
            await stack.workspace.removeStack(stackName);
            res.status(200).end();
        } catch (e) {
            if (e instanceof StackNotFoundError) {
                res.status(404).send(`stack "${stackName}" does not exist`);
            } else if (e instanceof ConcurrentUpdateError) {
                res.status(409).send(`stack "${stackName}" already has update in progress`)
            } else {
                res.status(500).send(e);
            }
        }
    };
}