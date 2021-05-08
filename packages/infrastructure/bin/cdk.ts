#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { LamyWikiWebsiteStack } from "../lib/LamyWikiWebsiteStack";

const app = new cdk.App();
const stackConfig = {
    env: {
        region: 'us-west-2',
        account: '057559841507'
    },
    terminationProtection: false
};

new LamyWikiWebsiteStack(app, "LamyWikiWebsiteStack", stackConfig);
app.synth();
