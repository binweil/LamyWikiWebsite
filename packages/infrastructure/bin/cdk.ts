#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { MiniTwitterFrontEndStack } from '../lib/frontend-stack';
import {MiniTwitterBackEndStack} from "../lib/backend-stack";
import {BuildStack} from "../lib/build-stack";

const app = new cdk.App();
const stackConfig = {
    env: {
        region: 'us-west-2',
        account: '057559841507'
    },
    terminationProtection: false
};

new BuildStack(app, 'BuildStack', stackConfig);

new MiniTwitterBackEndStack(app, 'BackEndStack', stackConfig);
new MiniTwitterFrontEndStack(app, 'FrontEndStack', stackConfig);
app.synth();
