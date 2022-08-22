import { Config } from "@backstage/config";
import { Logger } from "winston";
import { RouterOptions } from './router';
import * as pulumi from '@pulumi/pulumi';
import * as express from 'express';
import {
    LocalWorkspace,
    ConcurrentUpdateError,
    StackAlreadyExistsError,
    StackNotFoundError,
    ProjectSettings,
    InlineProgramArgs,
    LocalWorkspaceOptions
} from "@pulumi/pulumi/automation";
import { Bucket } from "@pulumi/gcp/storage";

export default class PulumiGcp {
    logger: Logger;

    config: Config;

    projectName = "tech-at-scale-pulumi";
    // FIXME provide correct gcp project
    gcpProject = "<YOUR_GCP_PROJECT_HERE";

    region = "northamerica-northeast1";
    backendUrl = "file://~"; // For testing only, production can use s3://
    projectSettings: ProjectSettings;
    inlineProgramArgs: InlineProgramArgs;
    localWorkspaceOptions: LocalWorkspaceOptions;

    public constructor(options: RouterOptions) {
        const { logger, config } = options;

        this.logger = logger;
        this.config = config;

        this.projectSettings = {
            name: this.projectName,
            runtime: 'nodejs',
            backend: { url: this.backendUrl },
        };

        this.inlineProgramArgs = {
            stackName: 'dev',
            projectName: this.projectName,
            program: this.createPulumiProgram('dev'),
        };

        this.localWorkspaceOptions = {
            projectSettings: this.projectSettings,
        };
    }

    createPulumiProgram = (_stackName: string, _content?: string) => async () => {
        const bucket = new Bucket("tech-at-scale-pulumi-meetup", {
            cors: [{
                maxAgeSeconds: 3600,
                methods: [
                    "GET",
                    "HEAD",
                    "PUT",
                    "POST",
                    "DELETE",
                ],
                origins: ["*"],
                responseHeaders: ["*"],
            }],
            forceDestroy: true,
            location: "US",
            uniformBucketLevelAccess: true,
            website: {
                mainPageSuffix: "index.html",
                notFoundPage: "404.html",
            },
        });

        // TODO As exercise for the reader, put some content and upload index.html

        return {
            websiteUrl: pulumi.interpolate `http://storage.googleapis.com/${bucket.name}/index.html`,
        };
    };

    // creates new sites
    public createHandler: express.RequestHandler = async (req, res) => {
        const stackName = req.body.id;
        const content = req.body.content as string;

        try {
            // create a new stack
            const stack = await LocalWorkspace.createStack({
                ...this.inlineProgramArgs,
                stackName,
                // generate our pulumi program on the fly from the POST body
                program: this.createPulumiProgram(stackName, content),
            },
                this.localWorkspaceOptions,
            );
            await stack.setConfig("gcp:region", { value: this.region });
            await stack.setConfig("gcp:project", { value: this.gcpProject });

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
            const ws = await LocalWorkspace.create({ projectSettings: this.projectSettings });
            const stacks = await ws.listStacks();
            res.json({ ids: stacks.map(s => s.name) });
        } catch (e) {
            res.status(500).send(e);
        }
    };
    // gets info about a specific site
    public getHandler: express.RequestHandler = async (req, res) => {
        const stackName = req.params.id;

        try {
            // select the existing stack
            const stack = await LocalWorkspace.selectStack({
                ...this.inlineProgramArgs,
                stackName,
                // don't need a program just to get outputs
                program: async () => { },
            },
                this.localWorkspaceOptions,
            );
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

        try {
            // select the existing stack
            const stack = await LocalWorkspace.selectStack({
                ...this.inlineProgramArgs,
                stackName,
                // generate our pulumi program on the fly from the POST body
                program: this.createPulumiProgram(stackName, content),
            },
                this.localWorkspaceOptions,
            );
            await stack.setConfig("gcp:region", { value: this.region });
            await stack.setConfig("gcp:project", { value: this.gcpProject });
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

        try {
            // select the existing stack
            const stack = await LocalWorkspace.selectStack({
                ...this.inlineProgramArgs,
                stackName,
                // don't need a program for destroy
                program: async () => { },
            },
                this.localWorkspaceOptions,
            );
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