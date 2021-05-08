import * as cdk from "@aws-cdk/core";
import {BackendStack} from "./backend-stack";
import {FrontendStack} from "./frontend-stack";

export class LamyWikiWebsiteStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        new BackendStack(this, "LamyWikiWebsite-Backend",{});
        //new FrontendStack(this, "LamyWikiWebsite-Frontend",{});
    }

}
