import * as cdk from "@aws-cdk/core";
import {BackendStack} from "./backend-stack";
import {FrontendStack} from "./frontend-stack";
import {CfnOutput} from "@aws-cdk/core";

export class LamyWikiWebsiteStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id);

        const backendStack = new BackendStack(this, "LamyWikiWebsite-Backend");
        new CfnOutput(this, "Status", {
            value: "Completed"
        })
    }

}
